const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { groupInvitationService } = require('../services');
const pick = require('../utils/pick');

/**
 * Invite a member to a group
 */
const inviteMemberToGroup = catchAsync(async (req, res) => {
    const { groupId, userId } = req.params;
    const invitation = await groupInvitationService.inviteMemberToGroup(groupId, userId, req.user.id);
    res.status(httpStatus.CREATED).send({ invitation });
});

/**
 * Accept an invitation
 */
const acceptInvitation = catchAsync(async (req, res) => {
    const { invitationId } = req.params;
    const invitation = await groupInvitationService.acceptInvitation(invitationId, req.user.id);
    res.status(httpStatus.OK).send({ invitation });
});

/**
 * Reject an invitation
 */
const rejectInvitation = catchAsync(async (req, res) => {
    const { invitationId } = req.params;
    const invitation = await groupInvitationService.rejectInvitation(invitationId, req.user.id);
    res.status(httpStatus.OK).send({ invitation });
});

/**
 * Cancel an invitation (by inviter)
 */
const cancelInvitation = catchAsync(async (req, res) => {
    const { invitationId } = req.params;
    const invitation = await groupInvitationService.cancelInvitation(invitationId, req.user.id);
    res.status(httpStatus.OK).send({ invitation });
});

/**
 * Get current user's invitations
 */
const getMyInvitations = catchAsync(async (req, res) => {
    const options = pick(req.query, ['limit', 'page']);
    const { status } = req.query;
    const invitations = await groupInvitationService.getInvitationsForUser(req.user.id, status, options);
    res.status(httpStatus.OK).send(invitations);
});

/**
 * Get invitations for a group (admin only)
 */
const getGroupInvitations = catchAsync(async (req, res) => {
    const { groupId } = req.params;
    const options = pick(req.query, ['limit', 'page']);
    const { status } = req.query;
    const invitations = await groupInvitationService.getInvitationsForGroup(groupId, status, options);
    res.status(httpStatus.OK).send(invitations);
});

/**
 * Get a single invitation by ID
 */
const getInvitationById = catchAsync(async (req, res) => {
    const { invitationId } = req.params;
    const invitation = await groupInvitationService.getInvitationById(invitationId);
    res.status(httpStatus.OK).send({ invitation });
});

module.exports = {
    inviteMemberToGroup,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation,
    getMyInvitations,
    getGroupInvitations,
    getInvitationById,
};
