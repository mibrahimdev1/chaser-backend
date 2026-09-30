const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const planValidation = require('../../validations/plan.validation');
const planController = require('../../controllers/plan.controller');

const router = express.Router();

router
    .route('/')
    .get(auth(), validate(planValidation.getPlans), planController.getPlans)
    .post(validate(planValidation.createPlan), planController.createPlan);

router.post('/subscribe', auth(), validate(planValidation.subscribe), planController.subscribe);
router.post('/unsubscribe', auth(), validate(planValidation.unsubscribe), planController.unsubscribe);
router.post('/giftSubscription', auth(), validate(planValidation.gift), planController.giftSubscription);

router.get('/subscriptions', auth(), validate(planValidation.getSubscriptions), planController.getSuscriptions);
router
    .route('/transactions')
    .get(auth('transactions'), validate(planValidation.getTransactions), planController.getTransactions);

router.patch(
    '/subscriptions/:subscriptionId/behaviour',
    auth(),
    validate(planValidation.updateBehaviour),
    planController.updateBehaviour,
);
router.route('/invoices').get(auth(), validate(planValidation.getInvoices), planController.getInvoices);
router.route('/:planId').patch(auth(), validate(planValidation.updatePlan), planController.updatePlan);
router
    .route('/:planId/price')
    .post(auth(), validate(planValidation.createPrice), planController.createPrice)
    .patch(auth(), validate(planValidation.updatePrice), planController.updatePrice);
module.exports = router;

/**
 * @swagger
 * /plans:
 *   get:
 *     summary: Get list of plans
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: true
 *         description: Number of items per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of plans
 */

/**
 * @swagger
 * /plans:
 *   post:
 *     summary: Create a new subscription plan
 *     description: Create a new plan with details such as name, amount, recurrence, and metadata.
 *     tags:
 *       - Plans
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - amount
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the subscription plan.
 *                 example: "Premium Plan"
 *               active:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the plan is active or not.
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Description of the plan.
 *               amount:
 *                 type: integer
 *                 minimum: 50
 *                 description: The amount in the smallest currency unit (e.g., cents).
 *                 example: 999
 *               recurring:
 *                 type: boolean
 *                 default: false
 *                 description: Whether the plan is recurring.
 *               billing_period:
 *                 type: string
 *                 enum: [day, week, month, year]
 *                 description: Billing period for the recurring plan.
 *                 example: "month"
 *               interval_count:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 description: Number of intervals between charges.
 *               marketing_features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 default: []
 *                 description: List of marketing features included in the plan.
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the plan.
 *                 properties:
 *                   category:
 *                     type: string
 *                     enum: [Basic, Premium]
 *                     description: Category of the plan.
 *                     example: "Premium"
 *     responses:
 *       201:
 *         description: Plan created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The unique identifier of the plan.
 *                 name:
 *                   type: string
 *                 amount:
 *                   type: integer
 *                 recurring:
 *                   type: boolean
 *                 billing_period:
 *                   type: string
 *                 interval_count:
 *                   type: integer
 *                 active:
 *                   type: boolean
 *       400:
 *         description: Validation error.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /plans/subscribe:
 *   post:
 *     summary: Subscribe to a plan
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Subscribe'
 *     responses:
 *       200:
 *         description: Subscription successful
 */

/**
 * @swagger
 * /plans/unsubscribe:
 *   post:
 *     summary: Unsubscribe from a plan
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
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
 *                 enum: [immediately, end_of_current_period]
 *                 description: Action to take when unsubscribing
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
 */

/**
 * @swagger
 * /plans/transactions:
 *   get:
 *     summary: Get user transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transaction list
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreatePlan:
 *       type: object
 *       required:
 *         - name
 *         - amount
 *       properties:
 *         name:
 *           type: string
 *           description: Plan name
 *         amount:
 *           type: integer
 *           description: Plan price in cents
 *         active:
 *           type: boolean
 *           default: true
 *         description:
 *           type: string
 *           description: Plan description
 *     Subscribe:
 *       type: object
 *       required:
 *         - priceId
 *       properties:
 *         priceId:
 *           type: string
 *           description: ID of the price to subscribe to
 *         promocode:
 *           type: string
 *           description: Optional promo code
 */
