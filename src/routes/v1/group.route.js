const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { groupValidation } = require('../../validations');
const { groupController } = require('../../controllers');

const router = express.Router();
router.post('/', auth(), validate(groupValidation.createGroup), groupController.createGroup);
router.get('/search', auth(), groupController.searchGroups);
router.put('/:groupId', auth(), validate(groupValidation.updateGroup), groupController.updateGroup);
router.delete('/:groupId', auth(), validate(groupValidation.getGroup), groupController.deleteGroup);
router.get('/:groupId', auth(), validate(groupValidation.getGroup), groupController.getGroupById);
router.post('/:groupId/members/:userId', auth(), validate(groupValidation.addMember), groupController.addMemberToGroup);
router.delete(
    '/:groupId/members/:userId',
    auth(),
    validate(groupValidation.addMember),
    groupController.removeMemberFromGroup,
);
router.post('/:groupId/admins/:userId', auth(), validate(groupValidation.addMember), groupController.addAdminToGroup);
router.delete(
    '/:groupId/admins/:userId',
    auth(),
    validate(groupValidation.addMember),
    groupController.removeAdminFromGroup,
);
router.post('/:groupId/join', auth(), validate(groupValidation.joinGroup), groupController.joinGroup);
router.delete('/:groupId/join', auth(), validate(groupValidation.leaveGroup), groupController.leaveGroup);
router.get('/', auth(), validate(groupValidation.getAllGroups), groupController.getAllGroups);
module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Group management and retrieval
 */

/**
 * @swagger
 * /groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: uri
 *                 description: URL of the group's profile picture
 *                 example: https://example.com/profile.jpg
 *               coverPicture:
 *                 type: string
 *                 format: uri
 *                 description: URL of the group's cover picture
 *                 example: https://example.com/cover.jpg
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Name of the group
 *                 example: Developers Group
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Description of the group
 *                 example: A group for developers to share knowledge
 *               industry:
 *                 type: string
 *                 maxLength: 100
 *                 description: Industry of the group
 *                 example: Technology
 *               location:
 *                 type: string
 *                 maxLength: 100
 *                 description: Location of the group
 *                 example: San Francisco, CA
 *               rules:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Rules of the group
 *                 example: Be respectful and stay on topic
 *               groupType:
 *                 type: string
 *                 enum: [public, private]
 *                 default: public
 *                 description: Type of the group
 *                 example: public
 *               permissions:
 *                 type: object
 *                 properties:
 *                   allowMemberInvites:
 *                     type: boolean
 *                     default: true
 *                     description: Whether members can invite others
 *                   requirePostApproval:
 *                     type: boolean
 *                     default: false
 *                     description: Whether posts require admin approval
 *                 description: Group permissions
 *                 example: { allowMemberInvites: true, requirePostApproval: false }
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: Bad request (e.g., invalid input data)
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /groups/{groupId}:
 *   put:
 *     summary: Update a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated name of the group
 *               description:
 *                 type: string
 *                 description: Updated description of the group
 *               rules:
 *                 type: string
 *                 description: Updated rules of the group
 *               groupType:
 *                 type: string
 *                 enum: [public, private]
 *                 description: Updated type of the group
 *     responses:
 *       200:
 *         description: Group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */

/**
 * @swagger
 * /groups/{groupId}:
 *   delete:
 *     summary: Delete a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group to delete
 *     responses:
 *       204:
 *         description: Group deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */

/**
 * @swagger
 * /groups/{groupId}:
 *   get:
 *     summary: Get a group by ID
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group to fetch
 *     responses:
 *       200:
 *         description: Group fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */

/**
 * @swagger
 * /groups/{groupId}/members/{userId}:
 *   post:
 *     summary: Add a member to a group
 *     tags: [Groups]
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
 *         description: ID of the user to add as a member
 *     responses:
 *       200:
 *         description: Member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: Bad request (e.g., user is already a member)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
/**
 * @swagger
 * /groups/{groupId}/members/{userId}:
 *   delete:
 *     summary: Remove a member from a group
 *     tags: [Groups]
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
 *         description: ID of the user to remove as a member
 *     responses:
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: Bad request (e.g., user is not a member)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */

/**
 * @swagger
 * /groups/{groupId}/admins/{userId}:
 *   post:
 *     summary: Add an admin to a group
 *     tags: [Groups]
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
 *         description: ID of the user to add as an admin
 *     responses:
 *       200:
 *         description: Admin added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: Bad request (e.g., user is already an admin)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */

/**
 * @swagger
 * /groups/{groupId}/admins/{userId}:
 *   delete:
 *     summary: Remove an admin from a group
 *     tags: [Groups]
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
 *         description: ID of the user to remove as an admin
 *     responses:
 *       200:
 *         description: Admin removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: Bad request (e.g., user is not an admin)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
/**
 * @swagger
 * /groups:
 *   get:
 *     summary: Get all groups
 *     tags: [Groups]
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
 *         name: forUser
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, returns only groups created by the authenticated user
 *     responses:
 *       200:
 *         description: List of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Group'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /groups/search:
 *   get:
 *     summary: Search groups by name or description
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
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
 *         name: myGroups
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, returns only groups where the authenticated user is a member or admin
 *       - in: query
 *         name: publicGroups
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, returns only public groups
 *     responses:
 *       200:
 *         description: List of matching groups with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Group'
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   description: Number of items per page
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                   example: 5
 *                 totalResults:
 *                   type: integer
 *                   description: Total number of matching groups
 *                   example: 47
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Group:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the group
 *         profilePicture:
 *           type: string
 *           description: URL of the group's profile picture
 *         coverPicture:
 *           type: string
 *           description: URL of the group's cover picture
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Name of the group
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Description of the group
 *         industry:
 *           type: string
 *           maxLength: 100
 *           description: Industry of the group
 *         location:
 *           type: string
 *           maxLength: 100
 *           description: Location of the group
 *         rules:
 *           type: string
 *           maxLength: 1000
 *           description: Rules of the group
 *         groupType:
 *           type: string
 *           enum: [public, private]
 *           default: public
 *           description: Type of the group
 *         permissions:
 *           type: object
 *           properties:
 *             allowMemberInvites:
 *               type: boolean
 *               default: true
 *               description: Whether members can invite others
 *             requirePostApproval:
 *               type: boolean
 *               default: false
 *               description: Whether posts require admin approval
 *         admins:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *           description: List of group admins
 *         members:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *           description: List of group members
 *         memberCount:
 *           type: integer
 *           default: 0
 *           description: Number of members in the group
 *         postCount:
 *           type: integer
 *           default: 0
 *           description: Number of posts in the group
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the group was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the group was last updated
 *       example:
 *         id: 60d0fe4f5311236168a109ca
 *         profilePicture: https://example.com/profile.jpg
 *         coverPicture: https://example.com/cover.jpg
 *         name: Developers Group
 *         description: A group for developers to share knowledge
 *         industry: Technology
 *         location: San Francisco, CA
 *         rules: Be respectful and stay on topic
 *         groupType: public
 *         permissions:
 *           allowMemberInvites: true
 *           requirePostApproval: false
 *         admins:
 *           - id: 60d0fe4f5311236168a109cb
 *             username: john_doe
 *             email: john@example.com
 *             profilePicture: https://example.com/john.jpg
 *         members:
 *           - id: 60d0fe4f5311236168a109cc
 *             username: jane_doe
 *             email: jane@example.com
 *             profilePicture: https://example.com/jane.jpg
 *         memberCount: 2
 *         postCount: 5
 *         createdAt: 2023-07-01T12:00:00Z
 *         updatedAt: 2023-07-01T12:00:00Z
 */
