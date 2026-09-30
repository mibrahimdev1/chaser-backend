const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { helpCenterController } = require('../../controllers');
const { helpcenterValidation } = require('../../validations');

const router = express.Router();

router.post('/help_request', auth(), helpCenterController.createHelpRequest);
router.post(
    '/contact-form',
    auth(),
    validate(helpcenterValidation.contactForm),
    helpCenterController.createContactForm,
);
router.get('/list_help_request', auth(), helpCenterController.listHelpRequests);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: HelpCenter
 *   description: User management and retrieval
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     HelpRequest:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: The ID of the user creating the help request
 *           example: 64c1e74a2b8e3f2c7e98d9c3
 *         subject:
 *           type: string
 *           description: The subject of the help request
 *           example: Unable to login
 *         message:
 *           type: string
 *           description: The detailed message explaining the help request
 *           example: I am unable to access my account due to a password reset issue.
 *       required:
 *         - userId
 *         - subject
 *         - message
 *   responses:
 *     HelpRequestCreated:
 *       description: Help request successfully created
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Help request created successfully
 *               helpRequest:
 *                 $ref: '#/components/schemas/HelpRequest'
 *     ValidationError:
 *       description: Validation failed
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Validation failed
 */

/**
 * @swagger
 * /helpcenter/help_request:
 *   post:
 *     summary: Create a new help request
 *     tags: [HelpCenter]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 description: The subject of the help request
 *                 example: Unable to login
 *               message:
 *                 type: string
 *                 description: The detailed message explaining the help request
 *                 example: I am unable to access my account due to a password reset issue.
 *     responses:
 *       201:
 *         $ref: '#/components/responses/HelpRequestCreated'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */

/**
 * @swagger
 * /helpcenter/list_help_request:
 *   get:
 *     summary: Fetch all help center requests
 *     tags: [HelpCenter]
 *     security:
 *       - bearerAuth: [] # Assuming authentication is required
 *     responses:
 *       200:
 *         $ref: '#/components/responses/HelpRequestsFetched'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: An error occurred while fetching help requests.
 */
