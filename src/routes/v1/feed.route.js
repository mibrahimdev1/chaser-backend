const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { feedController } = require('../../controllers');
const { feedValidation } = require('../../validations');

const router = express.Router();

router.get('/', auth(), validate(feedValidation.getFeeds), feedController.getFeeds);
router.get('/search', auth(), validate(feedValidation.searchEngine), feedController.searchEngine);
router.post('/create', auth(), validate(feedValidation.createPost), feedController.createPost);
router.get('/scheduledPosts', auth(), feedController.getScheduledPosts);
router.get('/report', auth(), feedController.getReportedPosts);
router.get('/report/:reportId', auth(), feedController.getReport);
router.get('/media/company/:companyId', auth(), feedController.getMediaPostsByCompany); // IMPORTANT: This is used to get the media posts by company
router.get('/media/:userId', auth(), feedController.getMediaPostsByUser);
router.get('/media/videos/:userId', auth(), feedController.getVideoPostsByUser);
router.get('/media/videos/group/:groupId', auth(), feedController.getVideoPostsByGroup);
router.get('/:postId', auth(), feedController.getFeed);
router.put('/:postId', auth(), validate(feedValidation.updatePost), feedController.updatePost);
router.delete('/:postId', auth(), feedController.deleteFeed);
router.get('/:postId/reportedUsers', auth(), feedController.getPostReporters);
router.post('/:postId/report', auth(), feedController.reportPost);
router.post('/:postId/suspend', auth(), feedController.suspendPost);
router.patch('/:postId/like', auth(), feedController.likePost);
router.get('/:postId/like', auth(), feedController.getLikedProfiles);
router.get('/:postId/comment', auth(), feedController.getCommentsOnPost);
router.post('/:postId/comment', auth(), feedController.commentOnPost);
router.post('/:postId/share', auth(), feedController.sharePost);
router.post('/:postId/vote', auth(), feedController.votePoll);
router.get('/:postId/results', auth(), feedController.getPollResults);
router.get('/:postId/comment/:commentId/reply', auth(), feedController.getReplies);
router.post('/:postId/comment/:commentId/reply', auth(), feedController.replyToComment);
router.post('/:postId/comment/:commentId/like', auth(), feedController.toggleLikeComment);
router.post('/:postId/comment/:commentId/delete', auth(), feedController.deleteComment);
router.post('/:postId/comment/:commentId/report', auth(), feedController.reportComment);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Feed
 *   description: Feed management and retrieval
 */

/**
 * @swagger
 * /feeds:
 *   get:
 *     summary: Retrieve a list of feeds
 *     description: Fetches a paginated list of user posts, allowing filtering by user, post type, and search term.
 *     tags:
 *       - Feed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter posts by a specific user ID
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Filter posts by a specific Company ID
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *         description: Filter posts by a specific groups
 *       - in: query
 *         name: postType
 *         schema:
 *           type: string
 *           enum: [job, video, event, celebrate, poll, media]
 *         description: Filter posts by type (job, event, etc.)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search posts by caption or comments
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of posts to return (default 10)
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (ISO timestamp of the last fetched post). Ignored if page is provided.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination (optional). When provided, uses page-based pagination instead of cursor-based.
 *     responses:
 *       200:
 *         description: A list of posts with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "65c12345abcd67890ef12345"
 *                       caption:
 *                         type: string
 *                         example: "Excited to announce my new job!"
 *                       postType:
 *                         type: string
 *                         example: "job"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-02-07T15:00:00.000Z"
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *                   example: "2025-02-07T14:30:00.000Z"
 *       400:
 *         description: Validation error in query parameters
 *       401:
 *         description: Unauthorized, authentication required
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /feed/{postId}:
 *   put:
 *     summary: Update a post
 *     description: Updates an existing post identified by postId. Requires authentication. Only provided fields will be updated.
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the post to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isReel:
 *                 type: boolean
 *                 description: Indicates if the post is a reel
 *               postType:
 *                 type: string
 *                 description: Type of the post
 *               companyId:
 *                 type: string
 *                 format: objectId
 *                 description: ID of the associated company, if any
 *               groupId:
 *                 type: string
 *                 format: objectId
 *                 description: ID of the associated group, if any
 *               caption:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Caption for the post
 *               media:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Media'
 *                 description: Array of media objects
 *               poll:
 *                 $ref: '#/components/schemas/Poll'
 *                 description: Poll object for the post
 *               tags:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: ID of the tagged entity
 *                     type:
 *                       type: string
 *                       enum: [user, company, group]
 *                       description: Type of the tagged entity
 *                     displayName:
 *                       type: string
 *                       description: Display name of the tagged entity (e.g., @username)
 *                   required:
 *                     - id
 *                     - type
 *                     - displayName
 *                 description: Array of tagged entities
 *               status:
 *                 type: string
 *                 enum: [published, scheduled, draft]
 *                 description: Status of the post
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled publication date, must be in the future
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 post:
 *                   $ref: '#/components/schemas/Feed'
 *       400:
 *         description: Bad request (e.g., invalid postId, invalid request body)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized, authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /feeds/{postId}:
 *   delete:
 *     summary: Delete a post along with its comments
 *     description: Deletes a post and all its associated comments in an atomic operation.
 *     tags:
 *       - Feed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to delete
 *     responses:
 *       204:
 *         description: Post deleted successfully (No Content)
 *       404:
 *         description: Post not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /feeds/search:
 *   get:
 *     tags:
 *       - Feed
 *     security:
 *       - bearerAuth: []
 *     summary: Search for posts, users, groups, and company pages
 *     description: Retrieve posts, users, groups, and company pages matching the query.
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Search term
 *     responses:
 *       200:
 *         description: Successful search
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                 groups:
 *                   type: array
 *                   items:
 *                     type: object
 *                 companyPages:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /feeds/{postId}:
 *   get:
 *     summary: Get a single feed by its ID
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the feed to fetch
 *     responses:
 *       200:
 *         description: Feed fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feed'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Feed not found
 */
/**
 * @swagger
 * /feeds/create:
 *   post:
 *     summary: Create a new feed post
 *     tags:
 *       - Feed
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyId:
 *                 type: string
 *                 description: Optional company ID if the post is associated with a company
 *                 example: "65e1f6e7d3a23b0f2438a8c2"
 *               postType:
 *                 type: string
 *                 enum: [default, job, celebrate, event]
 *                 example: "event"
 *               caption:
 *                 type: string
 *                 example: "Excited to announce our company’s event!"
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: "https://example.com/image.jpg"
 *                     type:
 *                       type: string
 *                       enum: [image, video, gif, document]
 *                       example: "image"
 *               poll:
 *                 type: object
 *                 properties:
 *                   question:
 *                     type: string
 *                     example: "Which framework do you prefer?"
 *                   options:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["React", "Vue", "Angular"]
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-02-15T10:00:00Z"
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Invalid request
 *
 * /feeds/{postId}/like:
 *   patch:
 *     summary: Like or Unlike a post
 *     tags:
 *       - Feed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: "65e1f6e7d3a23b0f2438a8c2"
 *       - name: reaction
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           enum: [like, dislike, sad, angry, happy, celebrate]
 *         example: "like"
 *     responses:
 *       200:
 *         description: Post liked/unliked successfully
 *       400:
 *         description: Reaction is required
 *       404:
 *         description: Post not found
 *
 * /feeds/{postId}/comment:
 *   post:
 *     summary: Comment on a post
 *     tags:
 *       - Feed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: "65e1f6e7d3a23b0f2438a8c2"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 example: "This is awesome!"
 *     responses:
 *       200:
 *         description: Comment added successfully
 *       404:
 *         description: Post not found
 *
 * /feeds/{postId}/share:
 *   post:
 *     summary: Share a post (Repost or Add Own Thoughts)
 *     tags:
 *       - Feed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: "65e1f6e7d3a23b0f2438a8c2"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               caption:
 *                 type: string
 *                 example: "Totally agree with this post!"
 *     responses:
 *       201:
 *         description: Post shared successfully
 *       404:
 *         description: Post not found
 */

/**
 * @swagger
 * /feeds/{postId}/like:
 *   get:
 *     summary: Get profiles who liked a post
 *     description: Retrieves the list of users who liked a specific post.
 *     tags:
 *       - Feed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post
 *     responses:
 *       200:
 *         description: A list of user profiles who liked the post
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profiles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       displayName:
 *                         type: string
 *                       profilePicture:
 *                         type: string
 *       404:
 *         description: Post not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /feeds/{postId}/comment/{commentId}/reply:
 *   post:
 *     summary: Reply to a comment on a post
 *     description: Allows a user to reply to a comment within a post, creating a new comment with the specified comment as its parent.
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the parent comment to reply to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The reply text
 *               tags:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [user, group, company]
 *                     id:
 *                       type: string
 *                 description: Optional list of tagged users, groups, or companies
 *     responses:
 *       200:
 *         description: Reply added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comment:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     postId:
 *                       type: string
 *                     userId:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         displayName:
 *                           type: string
 *                         profilePicture:
 *                           type: string
 *                         fcmToken:
 *                           type: string
 *                     text:
 *                       type: string
 *                     taggedUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           displayName:
 *                             type: string
 *                           profilePicture:
 *                             type: string
 *                           fcmToken:
 *                             type: string
 *                     taggedGroups:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           profilePicture:
 *                             type: string
 *                     taggedCompanies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           profilePicture:
 *                             type: string
 *                     parentId:
 *                       type: string
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                   description: The newly created reply comment
 *       400:
 *         description: Bad request, invalid data
 *       401:
 *         description: Unauthorized, token required
 *       404:
 *         description: Post or parent comment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Parent comment not found"
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /feeds/{postId}/comment/{commentId}/reply:
 *   get:
 *     summary: Get replies to a comment
 *     description: Retrieves all replies to a specific comment within a post, identified by the comment's ID.
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post containing the comment
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the parent comment whose replies are to be retrieved
 *     responses:
 *       200:
 *         description: Successfully retrieved replies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       postId:
 *                         type: string
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           displayName:
 *                             type: string
 *                           profilePicture:
 *                             type: string
 *                           fcmToken:
 *                             type: string
 *                       text:
 *                         type: string
 *                       likes:
 *                         type: array
 *                         items:
 *                           type: string
 *                       likeCount:
 *                         type: number
 *                       taggedUsers:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             firstName:
 *                               type: string
 *                             lastName:
 *                               type: string
 *                             displayName:
 *                               type: string
 *                             profilePicture:
 *                               type: string
 *                             fcmToken:
 *                               type: string
 *                       taggedGroups:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             profilePicture:
 *                               type: string
 *                       taggedCompanies:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             profilePicture:
 *                               type: string
 *                       parentId:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                   description: Array of reply comments to the specified comment
 *       401:
 *         description: Unauthorized, token required
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment not found"
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /feeds/{postId}/comment/{commentId}/like:
 *   post:
 *     summary: Toggle like/unlike on a comment
 *     description: Likes a comment if not already liked; otherwise, unlikes it.
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post containing the comment
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to like/unlike
 *     responses:
 *       200:
 *         description: Successfully toggled like/unlike on comment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment liked"
 *                 likeCount:
 *                   type: integer
 *                   example: 5
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment not found"
 *       401:
 *         description: Unauthorized access
 */

/**
 * @swagger
 * /feeds/{postId}/comment/{commentId}/delete:
 *   post:
 *     summary: Delete a comment and its child comments
 *     description: Deletes a comment and all its child comments if the user is the owner or has admin privileges. Updates the post's comment count accordingly.
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post containing the comment
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to be deleted
 *     responses:
 *       200:
 *         description: Successfully deleted the comment and its child comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment and 3 child comment(s) deleted"
 *       403:
 *         description: User is not authorized to delete the comment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "You are not authorized to delete this comment"
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment not found"
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /feeds/scheduledPosts:
 *   get:
 *     summary: Get scheduled posts
 *     description: Retrieve a list of scheduled posts for the authenticated user.
 *     tags:
 *       - Feed
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of scheduled posts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Feed'
 *       401:
 *         description: Unauthorized. User is not authenticated.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Feed:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "65a0d1bfcf9d6b001f2a3d4c"
 *         userId:
 *           type: string
 *           description: Reference to the user who created the post.
 *           example: "65a0d1bfcf9d6b001f2a3d4b"
 *         caption:
 *           type: string
 *           description: Caption or description of the post.
 *           example: "Check out this awesome post!"
 *         media:
 *           type: array
 *           description: List of media files attached to the post.
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: Media file URL.
 *                 example: "https://example.com/image.jpg"
 *               type:
 *                 type: string
 *                 enum: [image, video, gif, document]
 *                 description: Type of media.
 *                 example: "image"
 *         poll:
 *           type: object
 *           description: Poll attached to the post (if any).
 *           properties:
 *             question:
 *               type: string
 *               example: "What's your favorite programming language?"
 *             options:
 *               type: array
 *               items:
 *                 type: string
 *                 example: "JavaScript"
 *             votes:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                     description: User who voted.
 *                     example: "65a0d1bfcf9d6b001f2a3d4e"
 *                   selectedOption:
 *                     type: string
 *                     example: "JavaScript"
 *         status:
 *           type: string
 *           enum: [published, draft]
 *           description: Status of the post.
 *           example: "published"
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *           description: Scheduled time for publishing.
 *           example: "2025-02-12T10:00:00.000Z"
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *             example: "65a0d1bfcf9d6b001f2a3d4f"
 *           description: List of user IDs who liked the post.
 *         shares:
 *           type: array
 *           items:
 *             type: string
 *             example: "65a0d1bfcf9d6b001f2a3d50"
 *           description: List of user IDs who shared the post.
 *         sharedPost:
 *           type: object
 *           description: Details of the shared post (if applicable).
 *           properties:
 *             originalPost:
 *               type: string
 *               example: "65a0d1bfcf9d6b001f2a3d51"
 *             caption:
 *               type: string
 *               example: "Check this out!"
 *         commentCount:
 *           type: number
 *           example: 5
 *           description: Number of comments on the post.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the post was created.
 *           example: "2025-02-10T12:30:45.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the post was last updated.
 *           example: "2025-02-10T12:35:20.000Z"
 */

/**
 * @swagger
 * /feeds/{postId}/comment:
 *   get:
 *     summary: Get comments on a post
 *     description: Retrieve all comments associated with a given post ID.
 *     tags:
 *       - Feed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to fetch comments for.
 *     responses:
 *       200:
 *         description: Successfully retrieved comments.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Comment ID.
 *                       postId:
 *                         type: string
 *                         description: Associated post ID.
 *                       user:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: User ID.
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           displayName:
 *                             type: string
 *                           profilePicture:
 *                             type: string
 *                             format: uri
 *                             description: URL of the user's profile picture.
 *                       text:
 *                         type: string
 *                         description: Comment text.
 *                       likes:
 *                         type: array
 *                         items:
 *                           type: string
 *                           description: User IDs who liked the comment.
 *                       likeCount:
 *                         type: integer
 *                         description: Total number of likes on the comment.
 *                       replies:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             userId:
 *                               type: string
 *                               description: ID of the user who replied.
 *                             text:
 *                               type: string
 *                               description: Reply text.
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *                               description: Date the reply was created.
 *       400:
 *         description: Invalid request parameters.
 *       401:
 *         description: Unauthorized, authentication required.
 *       404:
 *         description: Post not found.
 *       500:
 *         description: Server error.
 */

/**
 * @swagger
 * /feeds/{postId}/vote:
 *   post:
 *     summary: Vote in a poll
 *     description: Allows an authenticated user to vote in a poll associated with a feed post.
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post containing the poll
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - selectedOption
 *             properties:
 *               selectedOption:
 *                 type: string
 *                 description: The option selected by the user
 *     responses:
 *       200:
 *         description: Successfully voted in the poll
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 post:
 *                   type: object
 *                   description: Updated post with the new vote
 *                 results:
 *                   type: object
 *                   description: Current poll results
 *       400:
 *         description: Invalid poll option selected
 *       404:
 *         description: Poll not found for this post
 */

/**
 * @swagger
 * /feeds/{postId}/results:
 *   get:
 *     summary: Get poll results
 *     description: Retrieves the current vote counts and percentages for a poll.
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post containing the poll
 *     responses:
 *       200:
 *         description: Successfully retrieved poll results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: object
 *                   description: Poll results with vote counts and percentages
 *       404:
 *         description: Poll not found for this post
 */

/**
 * @swagger
 * /feeds/media/company/{companyId}:
 *   get:
 *     summary: Get media posts by company
 *     description: Retrieve all image posts (media) associated with a specific company. Returns only posts that contain image media files.
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the company whose media posts to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved media posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Post ID
 *                         example: "65c12345abcd67890ef12345"
 *                       media:
 *                         type: array
 *                         description: Array of image media items
 *                         items:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                               format: uri
 *                               description: URL of the image
 *                               example: "https://example.com/image.jpg"
 *                             type:
 *                               type: string
 *                               enum: [image]
 *                               description: Type of media (always 'image' for this endpoint)
 *                               example: "image"
 *       401:
 *         description: Unauthorized, authentication required
 *       404:
 *         description: Company not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /feeds/media/{userId}:
 *   get:
 *     summary: Get media posts by user
 *     description: Retrieve all image posts (media) associated with a specific user. Returns only posts that contain image media files.
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the user whose media posts to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved media posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Post ID
 *                         example: "65c12345abcd67890ef12345"
 *                       media:
 *                         type: array
 *                         description: Array of image media items
 *                         items:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                               format: uri
 *                               description: URL of the image
 *                               example: "https://example.com/image.jpg"
 *                             type:
 *                               type: string
 *                               enum: [image]
 *                               description: Type of media (always 'image' for this endpoint)
 *                               example: "image"
 *       401:
 *         description: Unauthorized, authentication required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Feed:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the feed
 *         userId:
 *           $ref: '#/components/schemas/User'
 *           description: The user who created the feed
 *         companyId:
 *           type: string
 *           description: ID of the company associated with the feed (if applicable)
 *         groupId:
 *           type: string
 *           description: ID of the group associated with the feed (if applicable)
 *         postType:
 *           type: string
 *           enum: [sharedPost, poll, celebrate, default, document, video, job, event, media]
 *           description: Type of the post
 *         caption:
 *           type: string
 *           description: Caption of the post
 *         media:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: URL of the media file
 *               type:
 *                 type: string
 *                 enum: [image, video, gif, document]
 *                 description: Type of the media file
 *         poll:
 *           type: object
 *           properties:
 *             question:
 *               type: string
 *               description: Poll question
 *             options:
 *               type: array
 *               items:
 *                 type: string
 *               description: Poll options
 *             votes:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                     description: ID of the user who voted
 *                   selectedOption:
 *                     type: string
 *                     description: The option selected by the user
 *         status:
 *           type: string
 *           enum: [published, scheduled, draft]
 *           description: Status of the post
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *           description: Scheduled time for the post (if applicable)
 *         likes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *           description: List of users who liked the post
 *         shares:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *           description: List of users who shared the post
 *         sharedPost:
 *           type: object
 *           properties:
 *             originalPost:
 *               $ref: '#/components/schemas/Feed'
 *               description: The original post that was shared
 *             caption:
 *               type: string
 *               description: Caption added while sharing the post
 *         likeCount:
 *           type: integer
 *           description: Number of likes on the post
 *         shareCount:
 *           type: integer
 *           description: Number of shares of the post
 *         commentCount:
 *           type: integer
 *           description: Number of comments on the post
 *         meta:
 *           type: object
 *           description: Additional metadata for the post
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the feed was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the feed was last updated
 *       example:
 *         id: 60d0fe4f5311236168a109ca
 *         userId:
 *           id: 60d0fe4f5311236168a109cb
 *           username: john_doe
 *           email: john@example.com
 *           profilePicture: https://example.com/john.jpg
 *           bio: Software Developer
 *         companyId: 60d0fe4f5311236168a109cc
 *         groupId: 60d0fe4f5311236168a109cd
 *         postType: default
 *         caption: This is a sample post
 *         media:
 *           - url: https://example.com/image.jpg
 *             type: image
 *         poll:
 *           question: What is your favorite programming language?
 *           options:
 *             - JavaScript
 *             - Python
 *             - Java
 *           votes:
 *             - userId: 60d0fe4f5311236168a109cb
 *               selectedOption: JavaScript
 *         status: published
 *         scheduledAt: 2023-07-01T12:00:00Z
 *         likes:
 *           - id: 60d0fe4f5311236168a109cb
 *             username: john_doe
 *             email: john@example.com
 *             profilePicture: https://example.com/john.jpg
 *         shares:
 *           - id: 60d0fe4f5311236168a109cc
 *             username: jane_doe
 *             email: jane@example.com
 *             profilePicture: https://example.com/jane.jpg
 *         sharedPost:
 *           originalPost:
 *             id: 60d0fe4f5311236168a109ce
 *             userId:
 *               id: 60d0fe4f5311236168a109cf
 *               username: alice_smith
 *               email: alice@example.com
 *               profilePicture: https://example.com/alice.jpg
 *               bio: Product Manager
 *             caption: This is the original post
 *           caption: Shared with additional context
 *         likeCount: 10
 *         shareCount: 5
 *         commentCount: 3
 *         meta:
 *           key: value
 *         createdAt: 2023-07-01T12:00:00Z
 *         updatedAt: 2023-07-01T12:00:00Z
 */
