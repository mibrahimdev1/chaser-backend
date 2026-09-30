const express = require('express');
const { userConnectionController } = require('../../controllers');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.post('/send', auth(), userConnectionController.sendFriendRequest);
router.put('/accept/:requestId', auth(), userConnectionController.acceptFriendRequest);
router.put('/reject/:requestId', auth(), userConnectionController.rejectFriendRequest);
router.put('/unfriend/:requestId', auth(), userConnectionController.unfriend);
router.get('/friends', auth(), userConnectionController.getFriends);
router.get('/getUserList', auth(), userConnectionController.getUserList);
router.get('/pending', auth(), userConnectionController.getPendingRequests);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: UserConnections
 *   description: API for managing user connections
 */

/**
 * @swagger
 * /connections/friends:
 *   get:
 *     summary: Get a list of friends
 *     tags: [UserConnections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of friends
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   profilePicture:
 *                     type: string
 */
/**
 * @swagger
 * /connections/getUserList:
 *   get:
 *     summary: get Followers/Following of Users based on action
 *     tags: [UserConnections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         required: true
 *         description: Action to perform (e.g., 'follower', 'following')
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *         description: Provide UserId here to get follower/following of that user
 *     responses:
 *       200:
 *         description: An array of users based on the action
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       profilePicture:
 *                         type: string
 *       400:
 *         description: Bad request (e.g., invalid action)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /connections/pending:
 *   get:
 *     summary: Get a list of pending friend requests
 *     tags: [UserConnections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of pending requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   sender:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       profilePicture:
 *                         type: string
 */

/**
 * @swagger
 * /connections/send:
 *   post:
 *     summary: Send a friend request
 *     tags: [UserConnections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *             properties:
 *               receiverId:
 *                 type: string
 *                 description: ID of the user receiving the request
 *     responses:
 *       201:
 *         description: Friend request sent successfully
 *       400:
 *         description: Bad request (e.g., request already sent, self-request)
 */

/**
 * @swagger
 * /connections/accept/{requestId}:
 *   put:
 *     summary: Accept a friend request
 *     tags: [UserConnections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the friend request
 *     responses:
 *       200:
 *         description: Friend request accepted successfully
 *       404:
 *         description: Friend request not found
 */

/**
 * @swagger
 * /connections/reject/{requestId}:
 *   put:
 *     summary: Reject a friend request
 *     tags: [UserConnections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the friend request
 *     responses:
 *       200:
 *         description: Friend request rejected successfully
 *       404:
 *         description: Friend request not found
 */
/**
 * @swagger
 * /connections/unfriend/{requestId}:
 *   put:
 *     summary: Unfriend a user (Remove connection)
 *     description: Removes an existing connection between two users using the request ID.
 *     tags:
 *       - UserConnections
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: requestId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: "65e1f6e7d3a23b0f2438a8c2"
 *     responses:
 *       200:
 *         description: Unfriended successfully
 *       404:
 *         description: Connection request not found
 *       500:
 *         description: Internal server error
 */
