const express = require('express');
const httpStatus = require('http-status');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const chatValidation = require('../../validations/chat.validation');
const chatController = require('../../controllers/chat.controller');
const catchAsync = require('../../utils/catchAsync');
const { Chat } = require('../../models');

const router = express.Router();

const adminPrivilege = catchAsync(async (req, res, next) => {
    const { chatId } = req.body;
    const chat = await Chat.findById(chatId);
    if (chat.type === 'private') {
        next();
        return;
    }
    if (chat.admin && req.user.id === chat.admin.toString()) {
        next();
        return;
    }
    res.status(httpStatus.FORBIDDEN).send({
        code: 403,
        message: 'You do not have admin rights to perform this action',
    });
});

router
    .post('/createChat', auth(), chatController.createChat)
    .post('/sendMessage', auth(), validate(chatValidation.sendMessage), chatController.sendMessage)
    .get('/report', auth(), chatController.getReports)
    .post('/report', auth(), validate(chatValidation.report), chatController.report)
    .post(
        '/huddle/addPeople',
        auth(),
        validate(chatValidation.addPeople),
        adminPrivilege,
        chatController.addPeopleInHuddle,
    )
    .post(
        '/huddle/removePeople',
        auth(),
        validate(chatValidation.removePeople),
        adminPrivilege,
        chatController.removePeopleInHuddle,
    )
    .post('/huddle', auth(), validate(chatValidation.addHuddle), chatController.addHuddle)
    .patch('/huddle', auth(), validate(chatValidation.updateHuddle), adminPrivilege, chatController.updateHuddle)
    .get('/huddle', auth(), validate(chatValidation.getHuddle), chatController.getHuddle)
    .get('/huddle/:huddleId/messages', auth(), validate(chatValidation.getHuddle), chatController.getMessages)
    .post('/huddle/:huddleId/leave', auth(), validate(chatValidation.leaveChat), chatController.leaveChat);
module.exports = router;
/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: API for managing chat
 */

/**
 * @swagger
 * /chat/huddle:
 *   get:
 *     summary: Get list of huddles
 *     description: Retrieves a list of huddles for the authenticated user. Supports pagination with cursor.
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         description: Number of results to return
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: cursor
 *         in: query
 *         description: Cursor for pagination (MongoDB ObjectId)
 *         required: false
 *         schema:
 *           type: string
 *       - name: type
 *         in: query
 *         description: Type of huddle to retrieve. Must be either "private" or "huddle".
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - private
 *             - huddle
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: '609b2b4e11b44e3f8e9e3b1a'
 *                       message:
 *                         type: string
 *                         example: 'Hello, World!'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new huddle
 *     description: Create a new huddle with a name, description, and list of members.
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - name
 *               - members
 *             properties:
 *               description:
 *                 type: string
 *                 description: The description of the huddle.
 *                 example: "This is a new huddle."
 *               name:
 *                 type: string
 *                 description: The name of the huddle.
 *                 example: "Development Team"
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *                   description: The ID of a member.
 *                   example: "60c72b2f9b1e8a001c8e4b99"
 *     responses:
 *       201:
 *         description: Huddle created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: The ID of the created huddle.
 *                       example: "60c72b2f9b1e8a001c8e4b99"
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation error"
 *       401:
 *         description: Unauthorized. Authentication required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *
 *   patch:
 *     summary: Update a huddle
 *     description: Update the details of an existing huddle, including the name, description, and profile picture.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chatId
 *             properties:
 *               chatId:
 *                 type: string
 *                 description: The ID of the chat huddle to update
 *               name:
 *                 type: string
 *                 description: The new name for the huddle (optional)
 *               description:
 *                 type: string
 *                 description: The new description for the huddle (optional)
 *               chatProfilePicture:
 *                 type: string
 *                 description: The new profile picture URL for the huddle (optional)
 *     responses:
 *       "200":
 *         description: Successfully updated the huddle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chat:
 *                   $ref: '#/components/schemas/Chat'
 *       "400":
 *         description: Bad request
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Chat not found
 */

/**
 * @swagger
 * /chat/huddle/addPeople:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Add people to a huddle
 *     description: Adds multiple users to a specific huddle.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of user IDs to be added to the huddle.
 *               chatId:
 *                 type: string
 *                 description: ID of the huddle where users will be added.
 *             required:
 *               - userIds
 *               - chatId
 *     responses:
 *       '200':
 *         description: Successfully added users to the huddle.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Users added successfully
 *       '400':
 *         description: Bad request, invalid data provided.
 *       '401':
 *         description: Unauthorized, invalid token.
 *       '403':
 *         description: Forbidden, insufficient permissions.
 *       '404':
 *         description: Not found, huddle or users not found.
 */

/**
 * @swagger
 * /chat/huddle/removePeople:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Remove a person from a huddle
 *     description: Removes a specific user from a huddle.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to be removed from the huddle.
 *               chatId:
 *                 type: string
 *                 description: ID of the huddle from which the user will be removed.
 *             required:
 *               - userId
 *               - chatId
 *     responses:
 *       '200':
 *         description: Successfully removed user from the huddle.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User removed successfully
 *       '400':
 *         description: Bad request, invalid data provided.
 *       '401':
 *         description: Unauthorized, invalid token.
 *       '403':
 *         description: Forbidden, insufficient permissions.
 *       '404':
 *         description: Not found, huddle or user not found.
 */

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: general Report API
 */

/**
 * @swagger
 * /chat/report:
 *   post:
 *     summary: Report an issue or content
 *     description: Allows users to report issues or inappropriate content. Depending on the type, either reportedTo or chatId is required.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - reportType
 *               - type
 *             properties:
 *               reportedTo:
 *                 type: string
 *                 description: ID of the user being reported (required if type is user)
 *                 example: 60d21b4667d0d8992e610c86
 *               chatId:
 *                 type: string
 *                 description: ID of the chat being reported (required if type is chat or huddle)
 *                 example: 60d21b4667d0d8992e610c87
 *               content:
 *                 type: string
 *                 description: Content of the report
 *                 example: "This message is inappropriate"
 *               reportType:
 *                 type: string
 *                 enum: [fake-account, inappropriate-message, others, scam-or-spam]
 *                 description: Type of report
 *                 example: inappropriate-message
 *               type:
 *                 type: string
 *                 enum: [user, huddle, chat]
 *                 description: The type of entity being reported
 *                 example: chat
 *     responses:
 *       "201":
 *         description: Report submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 report:
 *                   type: object
 *                   description: Details of the submitted report
 *       "400":
 *         description: Bad request, validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: chatId is required when type is chat or huddle
 */
/**
 * @swagger
 * /chat/huddle/{huddleId}/messages:
 *   get:
 *     summary: Get messages for a specific huddle
 *     description: Retrieve all messages from a specific huddle by providing the huddleId.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: huddleId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the huddle
 *     responses:
 *       200:
 *         description: A list of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: The unique identifier of the message
 *                   chat_id:
 *                     type: string
 *                     description: The ID of the chat this message belongs to
 *                   sender_id:
 *                     type: string
 *                     description: The ID of the user who sent the message
 *                   content:
 *                     type: string
 *                     description: The content of the message
 *                   content_type:
 *                     type: string
 *                     enum: ['text', 'media', 'voicenote']
 *                     description: The type of content in the message
 *                   read:
 *                     type: boolean
 *                     description: Whether the message has been read
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: The date and time when the message was created
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     description: The date and time when the message was last updated
 *       400:
 *         description: Invalid huddleId
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Huddle not found
 */

/**
 * @swagger
 * /chat/huddle/{huddleId}/leave:
 *   post:
 *     summary: Leave or block a chat
 *     description: Allows the user to leave or block a chat (private or huddle). If it's a huddle chat, the user is removed from the members list. If the user is the admin, a new admin is assigned.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: huddleId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the huddle chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chatId
 *               - action
 *             properties:
 *               chatId:
 *                 type: string
 *                 description: Chat ID of the chat to leave or block
 *               action:
 *                 type: string
 *                 enum: [block, leave]
 *                 description: Action to perform => block or leave the chat
 *     responses:
 *       200:
 *         description: Action performed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Action performed successfully
 *       400:
 *         description: Invalid action
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid action
 *       404:
 *         description: Chat not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Chat not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
