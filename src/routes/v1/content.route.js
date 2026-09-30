const express = require('express');
const httpStatus = require('http-status');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const contentValidation = require('../../validations/content.validation');
const contentController = require('../../controllers/content.controller');

const { fileUpload } = require('../../services/upload.service');

const router = express.Router();

router
    .route('/')
    .post(auth('manageContent'), validate(contentValidation.addContent), contentController.addContent)
    .get(auth(), validate(contentValidation.getContent), contentController.getContent)
    .patch(auth('manageContent'), validate(contentValidation.updateContent), contentController.updateContent);
router.route('/upload').post(auth(), fileUpload, (req, res) => {
    //   res.status(httpStatus.CREATED).send({ url: req.files[0].url });
    res.status(httpStatus.CREATED).send({ url: req.files[0].path });
});
module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Content
 *   description: API for managing content
 */
/**
 * @swagger
 * /contents:
 *   post:
 *     summary: Add new content
 *     tags: [Content]
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
 *               - content_type
 *             properties:
 *               content:
 *                 type: object
 *                 description: The content text
 *               content_type:
 *                 type: string
 *                 enum:
 *                   - aboutus
 *                   - privacypolicy
 *                   - communityStandards
 *                 description: The type of the content
 *     responses:
 *       200:
 *         description: Content added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Content added successfully
 *       409:
 *         description: Conflict - Content already exists with this content type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Content already exists with this content type
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */

/**
 * @swagger
 * /contents:
 *   get:
 *     summary: Get content by type
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: content_type
 *         required: true
 *         type: string
 *         enum:
 *           - aboutus
 *           - privacypolicy
 *           - communityStandards
 *         description: The type of the content to retrieve
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: object
 *                   description: The content text
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Content not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */

/**
 * @swagger
 * /contents:
 *   patch:
 *     summary: Update content by type
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content_type
 *               - content
 *             properties:
 *               content_type:
 *                 type: string
 *                 enum:
 *                   - aboutus
 *                   - privacypolicy
 *                   - communityStandards
 *                 description: The type of the content to update
 *               content:
 *                 type: object
 *                 description: The updated content text
 *     responses:
 *       200:
 *         description: Content updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Content updated successfully
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid request parameters
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Content not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */

/**
 * @swagger
 * /contents/upload:
 *   post:
 *     summary: Upload a file
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: The URL of the uploaded file
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
