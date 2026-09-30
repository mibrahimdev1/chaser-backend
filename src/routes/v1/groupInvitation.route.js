const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { groupInvitationValidation } = require('../../validations');
const { groupInvitationController } = require('../../controllers');

const router = express.Router();

// Send invitation
router.post(
    '/groups/:groupId/invite/:userId',
    auth(),
    validate(groupInvitationValidation.inviteMember),
    groupInvitationController.inviteMemberToGroup,
);

// Accept invitation
router.post(
    '/invitations/:invitationId/accept',
    auth(),
    validate(groupInvitationValidation.acceptInvitation),
    groupInvitationController.acceptInvitation,
);

// Reject invitation
router.post(
    '/invitations/:invitationId/reject',
    auth(),
    validate(groupInvitationValidation.rejectInvitation),
    groupInvitationController.rejectInvitation,
);

// Cancel invitation (by inviter)
router.delete(
    '/invitations/:invitationId',
    auth(),
    validate(groupInvitationValidation.cancelInvitation),
    groupInvitationController.cancelInvitation,
);

// Get current user's invitations
router.get(
    '/invitations/me',
    auth(),
    validate(groupInvitationValidation.getInvitations),
    groupInvitationController.getMyInvitations,
);

// Get invitations for a group (admin only)
router.get(
    '/groups/:groupId/invitations',
    auth(),
    validate(groupInvitationValidation.getGroupInvitations),
    groupInvitationController.getGroupInvitations,
);

// Get a single invitation by ID
router.get(
    '/invitations/:invitationId',
    auth(),
    validate(groupInvitationValidation.getInvitation),
    groupInvitationController.getInvitationById,
);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Group Invitations
 *   description: Group invitation management
 */

/**
 * @swagger
 * /groups/{groupId}/invite/{userId}:
 *   post:
 *     summary: Invite a user to join a group
 *     tags: [Group Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to invite
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *       400:
 *         description: Bad request (user already member, invitation already pending, etc.)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (no permission to invite)
 *       404:
 *         description: Group or user not found
 */

/**
 * @swagger
 * /invitations/{invitationId}/accept:
 *   post:
 *     summary: Accept a group invitation
 *     tags: [Group Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the invitation
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 *       400:
 *         description: Bad request (invitation already processed, user already member)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not your invitation)
 *       404:
 *         description: Invitation not found
 */

/**
 * @swagger
 * /invitations/{invitationId}/reject:
 *   post:
 *     summary: Reject a group invitation
 *     tags: [Group Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the invitation
 *     responses:
 *       200:
 *         description: Invitation rejected successfully
 *       400:
 *         description: Bad request (invitation already processed)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not your invitation)
 *       404:
 *         description: Invitation not found
 */

/**
 * @swagger
 * /invitations/{invitationId}:
 *   delete:
 *     summary: Cancel a group invitation (by inviter)
 *     tags: [Group Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the invitation
 *     responses:
 *       200:
 *         description: Invitation cancelled successfully
 *       400:
 *         description: Bad request (invitation already processed)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not your invitation)
 *       404:
 *         description: Invitation not found
 *   get:
 *     summary: Get a single invitation by ID
 *     tags: [Group Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the invitation
 *     responses:
 *       200:
 *         description: Invitation retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Invitation not found
 */

/**
 * @swagger
 * /invitations/me:
 *   get:
 *     summary: Get current user's invitations
 *     tags: [Group Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected, cancelled]
 *         description: Filter by invitation status
 *     responses:
 *       200:
 *         description: List of invitations
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /groups/{groupId}/invitations:
 *   get:
 *     summary: Get invitations for a group (admin only)
 *     tags: [Group Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected, cancelled]
 *         description: Filter by invitation status
 *     responses:
 *       200:
 *         description: List of invitations for the group
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not an admin)
 *       404:
 *         description: Group not found
 */
