const { GroupInvitation, Group } = require('../models');
const userService = require('./user.service');
const notificationService = require('./notification.service');
const { generateNotificationBody, actions } = require('../config/notificationActions');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

/**
 * Invite a member to a group
 * @param {string} groupId - Group ID
 * @param {string} inviteeId - User ID to invite
 * @param {string} inviterId - User ID who is sending the invitation
 * @returns {Promise<GroupInvitation>}
 */
const inviteMemberToGroup = async (groupId, inviteeId, inviterId) => {
    // Get group
    const group = await Group.findById(groupId);
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
    }

    // Check if invitee is already a member or admin
    const inviteeIdStr = inviteeId.toString();
    const isMember = group.members.some((member) => member.toString() === inviteeIdStr);
    const isAdmin = group.admins.some((admin) => admin.toString() === inviteeIdStr);

    if (isMember || isAdmin) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User is already a member or admin of the group');
    }

    // Check if inviter has permission
    const inviterIdStr = inviterId.toString();
    const inviterIsAdmin = group.admins.some((admin) => admin.toString() === inviterIdStr);
    const inviterIsMember = group.members.some((member) => member.toString() === inviterIdStr);

    if (!inviterIsAdmin && !inviterIsMember) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You must be a member or admin of the group to invite others');
    }

    // If inviter is a member (not admin), check if members can invite
    if (inviterIsMember && !inviterIsAdmin && !group.permissions?.allowMemberInvites) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Members are not allowed to invite others to this group');
    }

    // Check for existing pending invitation
    const existingInvitation = await GroupInvitation.findOne({
        group: groupId,
        invitee: inviteeId,
        status: 'pending',
    });

    if (existingInvitation) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'An invitation is already pending for this user');
    }

    // Create invitation
    const invitation = await GroupInvitation.create({
        group: groupId,
        inviter: inviterId,
        invitee: inviteeId,
        status: 'pending',
    });

    // Get invitee user details for notification
    const inviteeUser = await userService.getUserById(inviteeId);
    if (!inviteeUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Invited user not found');
    }

    // Get inviter user details for notification
    const inviterUser = await userService.getUserById(inviterId);
    if (!inviterUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Inviter user not found');
    }

    // Send notification to invitee
    if (inviteeUser.fcmToken) {
        try {
            // Ensure all metadata values are strings for Firebase
            const metadata = {
                userId: inviterId.toString(),
                icon: inviterUser.profilePicture || '',
                invitationId: invitation._id.toString(),
            };

            const inviterName =
                inviterUser.username || inviterUser.displayName || `${inviterUser.firstName} ${inviterUser.lastName}`;
            await notificationService.sendNotificationToUser(
                inviteeUser.fcmToken,
                'Group Invitation',
                generateNotificationBody(actions.GROUP_INVITE, {
                    userName: inviterName,
                    groupName: group.name,
                }),
                { userId: inviteeId, companyId: null, groupId: groupId },
                metadata,
                true,
                actions.GROUP_INVITE,
            );
        } catch (error) {
            // Log error but don't fail the invitation creation
            console.error('Error sending notification:', error);
        }
    }

    // Populate and return invitation
    const invitationData = await GroupInvitation.findById(invitation._id)
        .populate('group', 'name description profilePicture')
        .populate('inviter', 'firstName lastName displayName email profilePicture')
        .populate('inviter.userProfile', 'username')
        .populate('invitee', 'firstName lastName displayName email profilePicture')
        .populate('invitee.userProfile', 'username')
        .lean();

    if (invitationData) {
        if (invitationData.inviter && invitationData.inviter.userProfile) {
            invitationData.inviter.username = invitationData.inviter.userProfile.username;
            delete invitationData.inviter.userProfile;
        }
        if (invitationData.invitee && invitationData.invitee.userProfile) {
            invitationData.invitee.username = invitationData.invitee.userProfile.username;
            delete invitationData.invitee.userProfile;
        }
    }

    return invitationData;
};

/**
 * Accept an invitation
 * @param {string} invitationId - Invitation ID
 * @param {string} userId - User ID accepting the invitation
 * @returns {Promise<GroupInvitation>}
 */
const acceptInvitation = async (invitationId, userId) => {
    const invitation = await GroupInvitation.findById(invitationId)
        .populate('group')
        .populate('inviter', 'firstName lastName displayName email profilePicture fcmToken')
        .populate('inviter.userProfile', 'username')
        .populate('invitee', 'firstName lastName displayName email profilePicture')
        .populate('invitee.userProfile', 'username')
        .lean();

    if (invitation) {
        if (invitation.inviter && invitation.inviter.userProfile) {
            invitation.inviter.username = invitation.inviter.userProfile.username;
            delete invitation.inviter.userProfile;
        }
        if (invitation.invitee && invitation.invitee.userProfile) {
            invitation.invitee.username = invitation.invitee.userProfile.username;
            delete invitation.invitee.userProfile;
        }
    }

    if (!invitation) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Invitation not found');
    }

    // Verify invitation belongs to the user
    if (invitation.invitee._id.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You can only accept your own invitations');
    }

    // Check invitation status
    if (invitation.status !== 'pending') {
        throw new ApiError(httpStatus.BAD_REQUEST, `Invitation is already ${invitation.status}`);
    }

    const group = invitation.group;

    // Check if user is already a member
    const userIdStr = userId.toString();
    const isMember = group.members.some((member) => member.toString() === userIdStr);
    const isAdmin = group.admins.some((admin) => admin.toString() === userIdStr);

    if (isMember || isAdmin) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'You are already a member of this group');
    }

    // Update invitation status
    invitation.status = 'accepted';
    await invitation.save();

    // Add user to group members
    group.members.push(userId);
    await group.save();
    await Group.incrementMemberCount(group._id);

    // Send notification to inviter
    if (invitation.inviter.fcmToken) {
        try {
            const inviteeName =
                invitation.invitee.username ||
                invitation.invitee.displayName ||
                `${invitation.invitee.firstName} ${invitation.invitee.lastName}`;
            // Ensure all metadata values are strings for Firebase
            const metadata = {
                userId: userId.toString(),
                icon: invitation.invitee.profilePicture || '',
            };

            await notificationService.sendNotificationToUser(
                invitation.inviter.fcmToken,
                'Group Invitation Accepted',
                generateNotificationBody(actions.GROUP_INVITE_ACCEPTED, {
                    userName: inviteeName,
                    groupName: group.name,
                }),
                { userId: invitation.inviter._id, companyId: null, groupId: group._id },
                metadata,
                true,
                actions.GROUP_INVITE_ACCEPTED,
            );
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    return invitation;
};

/**
 * Reject an invitation
 * @param {string} invitationId - Invitation ID
 * @param {string} userId - User ID rejecting the invitation
 * @returns {Promise<GroupInvitation>}
 */
const rejectInvitation = async (invitationId, userId) => {
    const invitation = await GroupInvitation.findById(invitationId)
        .populate('group')
        .populate('inviter', 'firstName lastName displayName email profilePicture fcmToken')
        .populate('inviter.userProfile', 'username')
        .populate('invitee', 'firstName lastName displayName email profilePicture')
        .populate('invitee.userProfile', 'username')
        .lean();

    if (invitation) {
        if (invitation.inviter && invitation.inviter.userProfile) {
            invitation.inviter.username = invitation.inviter.userProfile.username;
            delete invitation.inviter.userProfile;
        }
        if (invitation.invitee && invitation.invitee.userProfile) {
            invitation.invitee.username = invitation.invitee.userProfile.username;
            delete invitation.invitee.userProfile;
        }
    }

    if (!invitation) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Invitation not found');
    }

    // Verify invitation belongs to the user
    if (invitation.invitee._id.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You can only reject your own invitations');
    }

    // Check invitation status
    if (invitation.status !== 'pending') {
        throw new ApiError(httpStatus.BAD_REQUEST, `Invitation is already ${invitation.status}`);
    }

    // Update invitation status
    invitation.status = 'rejected';
    await invitation.save();

    // Send notification to inviter
    if (invitation.inviter.fcmToken) {
        try {
            const inviteeName =
                invitation.invitee.username ||
                invitation.invitee.displayName ||
                `${invitation.invitee.firstName} ${invitation.invitee.lastName}`;
            // Ensure all metadata values are strings for Firebase
            const metadata = {
                userId: userId.toString(),
                icon: invitation.invitee.profilePicture || '',
            };

            await notificationService.sendNotificationToUser(
                invitation.inviter.fcmToken,
                'Group Invitation Declined',
                generateNotificationBody(actions.GROUP_INVITE_REJECTED, {
                    userName: inviteeName,
                    groupName: invitation.group.name,
                }),
                { userId: invitation.inviter._id, companyId: null, groupId: invitation.group._id },
                metadata,
                true,
                actions.GROUP_INVITE_REJECTED,
            );
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    return invitation;
};

/**
 * Cancel an invitation (by inviter)
 * @param {string} invitationId - Invitation ID
 * @param {string} inviterId - User ID who sent the invitation
 * @returns {Promise<GroupInvitation>}
 */
const cancelInvitation = async (invitationId, inviterId) => {
    const invitation = await GroupInvitation.findById(invitationId)
        .populate('group')
        .populate('inviter', 'firstName lastName displayName email profilePicture')
        .populate('inviter.userProfile', 'username')
        .populate('invitee', 'firstName lastName displayName email profilePicture fcmToken')
        .populate('invitee.userProfile', 'username')
        .lean();

    if (invitation) {
        if (invitation.inviter && invitation.inviter.userProfile) {
            invitation.inviter.username = invitation.inviter.userProfile.username;
            delete invitation.inviter.userProfile;
        }
        if (invitation.invitee && invitation.invitee.userProfile) {
            invitation.invitee.username = invitation.invitee.userProfile.username;
            delete invitation.invitee.userProfile;
        }
    }

    if (!invitation) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Invitation not found');
    }

    // Verify invitation was sent by this user
    if (invitation.inviter._id.toString() !== inviterId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You can only cancel invitations you sent');
    }

    // Check invitation status
    if (invitation.status !== 'pending') {
        throw new ApiError(httpStatus.BAD_REQUEST, `Cannot cancel invitation that is already ${invitation.status}`);
    }

    // Update invitation status
    invitation.status = 'cancelled';
    await invitation.save();

    return invitation;
};

/**
 * Get invitations for a user
 * @param {string} userId - User ID
 * @param {string} status - Optional status filter
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>}
 */
const getInvitationsForUser = async (userId, status = null, options = {}) => {
    const filter = { invitee: userId };
    if (status) {
        filter.status = status;
    }

    const queryOptions = {
        ...options,
        populate: 'group,inviter',
        sort: { createdAt: -1 },
    };

    return await GroupInvitation.paginate(filter, queryOptions);
};

/**
 * Get invitations for a group (admin only)
 * @param {string} groupId - Group ID
 * @param {string} status - Optional status filter
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>}
 */
const getInvitationsForGroup = async (groupId, status = null, options = {}) => {
    const filter = { group: groupId };
    if (status) {
        filter.status = status;
    }

    const queryOptions = {
        ...options,
        populate: 'inviter,invitee',
        sort: { createdAt: -1 },
    };

    return await GroupInvitation.paginate(filter, queryOptions);
};

/**
 * Get a single invitation by ID
 * @param {string} invitationId - Invitation ID
 * @returns {Promise<GroupInvitation>}
 */
const getInvitationById = async (invitationId) => {
    const invitation = await GroupInvitation.findById(invitationId)
        .populate('group', 'name description profilePicture coverPicture groupType')
        .populate('inviter', 'firstName lastName displayName email profilePicture')
        .populate('inviter.userProfile', 'username')
        .populate('invitee', 'firstName lastName displayName email profilePicture')
        .populate('invitee.userProfile', 'username')
        .lean();

    if (invitation) {
        if (invitation.inviter && invitation.inviter.userProfile) {
            invitation.inviter.username = invitation.inviter.userProfile.username;
            delete invitation.inviter.userProfile;
        }
        if (invitation.invitee && invitation.invitee.userProfile) {
            invitation.invitee.username = invitation.invitee.userProfile.username;
            delete invitation.invitee.userProfile;
        }
    }

    if (!invitation) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Invitation not found');
    }

    return invitation;
};

module.exports = {
    inviteMemberToGroup,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation,
    getInvitationsForUser,
    getInvitationsForGroup,
    getInvitationById,
};
