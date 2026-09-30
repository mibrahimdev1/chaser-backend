const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { eventValidation } = require('../../validations');
const { eventController } = require('../../controllers');

const router = express.Router();

router
    .route('/')
    .get(auth(), validate(eventValidation.getEvents), eventController.get)
    .post(auth(), validate(eventValidation.createEvent), eventController.add);

// router.get('/eventBrite/login', eventController.loginEventBrite);
// router.get('/eventBrite/callback', eventController.eventBriteCallback);
// router.post('/eventBrite/sync', auth(), eventController.syncWithEventBrite);

router
    .route('/:eventId')
    .get(auth(), validate(eventValidation.getEvent), eventController.getEvent)
    .patch(auth(), validate(eventValidation.updateEvent), eventController.update)
    .delete(auth(), validate(eventValidation.deleteEvent), eventController.remove);
router
    .route('/:eventId/updateIntent')
    .patch(auth(), validate(eventValidation.updateIntent), eventController.updateIntent);
router.route('/:eventId/shareOnFeed').post(auth(), validate(eventValidation.shareOnFeed), eventController.shareOnFeed);
module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management and retrieval
 */

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events
 *     description: Retrieve all events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of events
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *   post:
 *     summary: Create a new event
 *     description: Add a new event to the system
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *
 * /events/{eventId}:
 *   get:
 *     summary: Get an event by ID
 *     description: Retrieve a single event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *   patch:
 *     summary: Update an event
 *     description: Update an event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *   delete:
 *     summary: Delete an event
 *     description: Remove an event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       204:
 *         description: No Content
 *
 * /events/{eventId}/updateIntent:
 *   patch:
 *     summary: Update event intent
 *     description: Update the user's intent for an event to either interested or notInterested.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [interested, notInterested]
 *                 description: Intent type (interested or notInterested)
 *     responses:
 *       200:
 *         description: Successfully updated event intent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Intent updated successfully
 *       400:
 *         description: Invalid input or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Intent type is invalid. It can only be interested or notInterested.
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /events/{eventId}/shareOnFeed:
 *   post:
 *     summary: Share an event on the feed
 *     description: Allows an authenticated user to share an event on their feed.
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the event to share
 *     responses:
 *       200:
 *         description: Event successfully shared on feed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feed:
 *                   type: object
 *                   description: The created feed object containing event details
 *       400:
 *         description: Invalid event ID
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: Event not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - title
 *         - date
 *         - time
 *         - location
 *         - price
 *         - organizedBy
 *         - imageUrl
 *       properties:
 *         title:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         time:
 *           type: string
 *         location:
 *           type: string
 *         price:
 *           type: number
 *         attendees:
 *           type: array
 *           items:
 *             type: string
 *             description: User ID
 *         organizedBy:
 *           type: string
 *           description: User ID
 *         interested:
 *           type: array
 *           items:
 *             type: string
 *             description: User ID
 *         notInterested:
 *           type: array
 *           items:
 *             type: string
 *             description: User ID
 *         imageUrl:
 *           type: string
 *       example:
 *         title: Edxn Sydney Mardi Gras Parade + After Party For Qu...
 *         date: 2024-12-31
 *         time: 21:00
 *         location: Kinselas Hotel
 *         price: 22.26
 *         attendees: [605c72ef2a9b3c1b8899f832, 605c72ef2a9b3c1b8899f833]
 *         organizedBy: 605c72ef2a9b3c1b8899f834
 *         interested: [605c72ef2a9b3c1b8899f835]
 *         notInterested: [605c72ef2a9b3c1b8899f836]
 *         imageUrl: 'https://example.com/image.jpg'
 */
