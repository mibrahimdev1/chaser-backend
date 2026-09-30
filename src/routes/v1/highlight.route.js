const express = require('express');
const { highlightController } = require('../../controllers');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.route('/').get(auth(), highlightController.getHighlights).post(auth(), highlightController.createHighlight);
router
    .route('/:highlightId')
    .put(auth(), highlightController.updateHighlight)
    .delete(auth(), highlightController.deleteHighlight);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Highlights
 *   description: API for managing story highlights
 */

/**
 * @swagger
 * /highlights:
 *   post:
 *     summary: Create a new highlight
 *     tags: [Highlights]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "My Travel Highlights"
 *               coverImage:
 *                 type: string
 *                 example: "https://example.com/cover.jpg"
 *               stories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60d5ec49fcd99b29b6a61df2", "60d5ec49fcd99b29b6a61df3"]
 *     responses:
 *       201:
 *         description: Highlight created successfully
 */

/**
 * @swagger
 * /highlights:
 *   get:
 *     summary: Get all highlights of the logged-in user
 *     tags: [Highlights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of highlights
 */

/**
 * @swagger
 * /highlights/{highlightId}:
 *   put:
 *     summary: Update a highlight
 *     tags: [Highlights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: highlightId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the highlight to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Highlight"
 *               coverImage:
 *                 type: string
 *                 example: "https://example.com/new-cover.jpg"
 *               stories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60d5ec49fcd99b29b6a61df2", "60d5ec49fcd99b29b6a61df3"]
 *     responses:
 *       200:
 *         description: Highlight updated successfully
 */

/**
 * @swagger
 * /highlights/{highlightId}:
 *   delete:
 *     summary: Delete a highlight
 *     tags: [Highlights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: highlightId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the highlight to delete
 *     responses:
 *       200:
 *         description: Highlight deleted successfully
 */
