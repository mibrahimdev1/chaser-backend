const express = require('express');
const auth = require('../../middlewares/auth');
// const validate = require('../../middlewares/validate');
const { notificationController } = require('../../controllers');

const router = express.Router();

router.post('/send-to-all', auth(), notificationController.sendToAll);
router.post('/send-to-user', auth(), notificationController.sendToUser);
router.patch('/mark-as-read/:notificationId', auth(), notificationController.markAsRead);
router.patch('/mark-all-as-read/:userId', auth(), notificationController.markAllAsRead);
router.get('/admin/all', auth('manageUsers'), notificationController.getAllAdminNotifications);
router.get('/:userId', auth(), notificationController.getNotifications);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management and retrieval
 */

/**
 * @swagger
 * /notifications/send-to-all:
 *   post:
 *     summary: Send a notification to all users
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - body
 *             properties:
 *               title:
 *                 type: string
 *                 description: Notification title
 *               body:
 *                 type: string
 *                 description: Notification body
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the notification
 *     responses:
 *       '200':
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification sent to all users
 *       '400':
 *         description: Bad request (e.g., missing title or body)
 *       '401':
 *         description: Unauthorized (missing or invalid token)
 */

/**
 * @swagger
 * /notifications/send-to-user:
 *   post:
 *     summary: Send a notification to a specific user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *               - title
 *               - body
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 description: FCM token of the user
 *               title:
 *                 type: string
 *                 description: Notification title
 *               body:
 *                 type: string
 *                 description: Notification body
 *               userId:
 *                 type: string
 *                 description: ID of the user
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the notification
 *     responses:
 *       '200':
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification sent to user
 *       '400':
 *         description: Bad request (e.g., missing fcmToken, title, or body)
 *       '401':
 *         description: Unauthorized (missing or invalid token)
 */

/**
 * @swagger
 * /notifications/mark-as-read/{notificationId}:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the notification to mark as read
 *     responses:
 *       '200':
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notification:
 *                   $ref: '#/components/schemas/Notification'
 *       '400':
 *         description: Bad request (e.g., missing notificationId)
 *       '401':
 *         description: Unauthorized (missing or invalid token)
 *       '404':
 *         description: Notification not found
 */

/**
 * @swagger
 * /notifications/mark-all-as-read/{userId}:
 *   patch:
 *     summary: Mark all notifications as read for a user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       '200':
 *         description: Notifications marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Marked 5 notifications as read
 *       '400':
 *         description: Bad request (e.g., missing userId)
 *       '401':
 *         description: Unauthorized (missing or invalid token)
 */

/**
 * @swagger
 * /notifications/admin/all:
 *   get:
 *     summary: Get all admin notifications (Admin only)
 *     description: Fetches all notifications in the system with optional filters. Only accessible by admins.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter notifications by read status (true/false)
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter notifications by action type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter notifications from this date (ISO 8601 format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter notifications until this date (ISO 8601 format)
 *     responses:
 *       '200':
 *         description: All notifications fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *       '401':
 *         description: Unauthorized (missing or invalid token)
 *       '403':
 *         description: Forbidden (only admins can access)
 */

/**
 * @swagger
 * /notifications/{userId}:
 *   get:
 *     summary: Fetch notifications for a user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter notifications by read status (true/false)
 *     responses:
 *       '200':
 *         description: Notifications fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *       '400':
 *         description: Bad request (e.g., missing userId)
 *       '401':
 *         description: Unauthorized (missing or invalid token)
 */
