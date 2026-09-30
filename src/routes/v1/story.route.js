const express = require('express');
const { storyController } = require('../../controllers');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { storyValidation } = require('../../validations');

const router = express.Router();

// Story Routes
router
    .route('/')
    .get(auth(), validate(storyValidation.getStories), storyController.getStories)
    .post(auth(), storyController.createStory);
router.get('/expired', storyController.getExpiredStories);
router.get('/followed', auth(), storyController.getFollowedUsersStories);
router.route('/:storyId').get(auth(), storyController.getStory).delete(auth(), storyController.deleteStory);

module.exports = router;
/**
 * @swagger
 * tags:
 *   name: Stories
 *   description: User Story Management Apis
 */

/**
 * @swagger
 * /stories:
 *   get:
 *     summary: Get all active stories
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose stories to fetch
 *     responses:
 *       200:
 *         description: List of active stories
 *   post:
 *     summary: Create a new story
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mediaUrl:
 *                 type: string
 *                 example: "https://example.com/story.jpg"
 *               mediaType:
 *                 type: string
 *                 enum: [image, video]
 *                 example: "image"
 *               textContent:
 *                 type: string
 *                 example: "This is a text story"
 *     responses:
 *       201:
 *         description: Story created successfully
 */

/**
 * @swagger
 * /stories/expired:
 *   get:
 *     summary: Get all expired stories
 *     tags: [Stories]
 *     responses:
 *       200:
 *         description: List of expired stories
 */

/**
 * @swagger
 * /stories/followed:
 *   get:
 *     summary: Get stories from followed users
 *     description: Retrieve all active stories from users that the authenticated user is following (accepted connections)
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of stories from followed users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "60f7b1b3b3f3f3f3f3f3f3f3"
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "60f7b1b3b3f3f3f3f3f3f3f4"
 *                           firstName:
 *                             type: string
 *                             example: "John"
 *                           lastName:
 *                             type: string
 *                             example: "Doe"
 *                           profilePicture:
 *                             type: string
 *                             example: "https://example.com/profile.jpg"
 *                       mediaUrl:
 *                         type: string
 *                         example: "https://example.com/story.jpg"
 *                       mediaType:
 *                         type: string
 *                         enum: [image, video]
 *                         example: "image"
 *                       textContent:
 *                         type: string
 *                         example: "This is a story from a followed user"
 *                       views:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["60f7b1b3b3f3f3f3f3f3f3f5"]
 *                       isExpired:
 *                         type: boolean
 *                         example: false
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-10-15T10:30:00.000Z"
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /stories/{storyId}:
 *   get:
 *     summary: Get a single story by ID
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the story
 *     responses:
 *       200:
 *         description: Story details
 *   delete:
 *     summary: Delete a story by ID
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the story to delete
 *     responses:
 *       200:
 *         description: Story deleted successfully
 */
