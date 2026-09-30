const { Group } = require('../models');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const groupInvitationService = require('./groupInvitation.service');

const createGroup = async (body, createdBy) => {
    const group = new Group({
        ...body,
        admins: [createdBy], // The creator is the first admin
        members: [createdBy], // The creator is also the first member
    });

    await group.save();
    return group;
};

const updateGroup = async (groupId, updateData) => {
    const group = await Group.findByIdAndUpdate(groupId, updateData, { new: true });
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
    }
    return group;
};
const deleteGroup = async (groupId) => {
    const group = await Group.findByIdAndDelete(groupId);
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
    }
};
const getGroupById = async (groupId) => {
    const group = await Group.findById(groupId)
        .populate('admins', 'firstName lastName displayName email profilePicture')
        .populate('admins.userProfile', 'username')
        .populate('members', 'firstName lastName displayName email profilePicture')
        .populate('members.userProfile', 'username');

    if (group) {
        if (group.admins) {
            group.admins.forEach((admin) => {
                if (admin.userProfile) {
                    admin.username = admin.userProfile.username;
                    delete admin.userProfile;
                }
            });
        }
        if (group.members) {
            group.members.forEach((member) => {
                if (member.userProfile) {
                    member.username = member.userProfile.username;
                    delete member.userProfile;
                }
            });
        }
    }
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
    }
    return group;
};
const addMemberToGroup = async (groupId, userId, inviterId) => {
    // This function now creates an invitation instead of directly adding
    // For backward compatibility, we delegate to the invitation service
    return await groupInvitationService.inviteMemberToGroup(groupId, userId, inviterId);
};
const removeMemberFromGroup = async (groupId, userId) => {
    const group = await Group.findById(groupId);
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
    }

    // Check if the user is a member
    if (!group.members.includes(userId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User is not a member of the group');
    }

    group.members = group.members.filter((member) => member.toString() !== userId);
    group.memberCount -= 1; // Decrement member count
    await group.save();
    return group;
};

/**
 * Check if a user is a member or admin of a group
 */
const isGroupMember = async (groupId, userId) => {
    const group = await Group.findById(groupId);
    if (!group) {
        return false;
    }

    const userIdStr = userId.toString();
    const isMember = group.members.some((member) => member.toString() === userIdStr);
    const isAdmin = group.admins.some((admin) => admin.toString() === userIdStr);

    return isMember || isAdmin;
};

/**
 * Allow a user to self-join a public group
 */
const joinGroup = async (groupId, userId) => {
    const group = await Group.findById(groupId);
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
    }

    // Check if group is public
    if (group.groupType !== 'public') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot join private group. Admin approval required.');
    }

    // Check if user is already a member or admin
    const userIdStr = userId.toString();
    const isMember = group.members.some((member) => member.toString() === userIdStr);
    const isAdmin = group.admins.some((admin) => admin.toString() === userIdStr);

    if (isMember || isAdmin) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User is already a member of the group');
    }

    // Add user to members array
    group.members.push(userId);
    await group.save();
    await Group.incrementMemberCount(groupId);

    return group;
};

/**
 * Allow a user to leave a group
 */
const leaveGroup = async (groupId, userId) => {
    const group = await Group.findById(groupId);
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
    }

    const userIdStr = userId.toString();

    // Check if user is an admin
    const isAdmin = group.admins.some((admin) => admin.toString() === userIdStr);
    if (isAdmin) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Admins cannot leave the group. Please remove admin status first or transfer ownership.',
        );
    }

    // Check if user is a member
    const isMember = group.members.some((member) => member.toString() === userIdStr);
    if (!isMember) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User is not a member of the group');
    }

    // Remove user from members array
    group.members = group.members.filter((member) => member.toString() !== userIdStr);
    group.memberCount -= 1;
    await group.save();

    return group;
};

const addAdminToGroup = async (groupId, userId) => {
    const group = await Group.findById(groupId);
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
    }

    // Check if the user is already an admin
    if (group.admins.includes(userId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User is already an admin of the group');
    }

    group.admins.push(userId);
    await group.save();
    return group;
};

const removeAdminFromGroup = async (groupId, userId) => {
    const group = await Group.findById(groupId);
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Group not found');
    }

    // Check if the user is an admin
    if (!group.admins.includes(userId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User is not an admin of the group');
    }

    group.admins = group.admins.filter((admin) => admin.toString() !== userId);
    await group.save();
    return group;
};

const getAllGroups = async (filters = {}, opt) => {
    const options = {
        ...opt,
        sort: { memberCount: -1 }, // Sort by most popular groups
        populate: 'admins,members',
    };

    // Remove forUser from options as it's not a database query option
    delete options.forUser;

    const groups = await Group.paginate(filters, options);
    return groups;
};

const searchGroups = async (query, page = 1, limit = 10, userId = null, myGroups = false, publicGroups = false) => {
    const options = {
        page,
        limit,
        sort: { memberCount: -1 }, // Sort by most popular groups
        populate: 'admins,members',
    };

    // Build the search filter
    const searchFilter = { $text: { $search: query } };

    // Add myGroups filter: user must be in members or admins array
    if (myGroups && userId) {
        searchFilter.$or = [{ members: userId }, { admins: userId }];
    }

    // Add publicGroups filter: groupType must be 'public'
    if (publicGroups) {
        searchFilter.groupType = 'public';
    }

    const groups = await Group.paginate(searchFilter, options);
    return groups;
};

module.exports = {
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupById,
    addMemberToGroup,
    removeMemberFromGroup,
    addAdminToGroup,
    removeAdminFromGroup,
    getAllGroups,
    searchGroups,
    joinGroup,
    leaveGroup,
    isGroupMember,
};
