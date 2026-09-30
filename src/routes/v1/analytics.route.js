const express = require('express');
const auth = require('../../middlewares/auth');
const { analyticsController } = require('../../controllers');

const router = express.Router();

router.post('/', auth(), analyticsController.analytics);
router.get('/revenue', auth(), analyticsController.revenueOverview);
router.get('/subscriptions', auth('manageUsers'), analyticsController.subscriptionAnalytics);
module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics and reporting
 */

/**
 * @swagger
 * /analytics/subscriptions:
 *   get:
 *     summary: Get subscription analytics
 *     description: Returns comprehensive subscription analytics including active subscriptions, monthly revenue, average subscription value, and churn rate. Only admins can access this endpoint.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activeSubscriptions:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: Total number of active subscriptions
 *                       example: 1250
 *                     lastMonth:
 *                       type: number
 *                       description: New subscriptions created last month
 *                       example: 85
 *                     change:
 *                       type: string
 *                       description: Percentage change from previous month
 *                       example: "+12.5"
 *                 monthlyRevenue:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: Total monthly revenue in USD
 *                       example: 12500.50
 *                     lastMonth:
 *                       type: number
 *                       description: Revenue from last month
 *                       example: 12500.50
 *                     change:
 *                       type: string
 *                       description: Percentage change from previous month
 *                       example: "+8.3"
 *                 avgSubscriptionValue:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: Average subscription value in USD
 *                       example: 29.99
 *                     lastMonth:
 *                       type: number
 *                       description: Average subscription value for new subscriptions last month
 *                       example: 32.50
 *                     change:
 *                       type: string
 *                       description: Percentage change from previous month
 *                       example: "+5.2"
 *                 churnRate:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: Current churn rate percentage
 *                       example: 3.2
 *                     lastMonth:
 *                       type: number
 *                       description: Churn rate for last month
 *                       example: 3.2
 *                     change:
 *                       type: string
 *                       description: Percentage change from previous month
 *                       example: "-0.5"
 *                 generatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp when the analytics were generated
 *                   example: "2024-01-15T10:30:00.000Z"
 *       401:
 *         description: Unauthorized - Access token is missing or invalid
 *       403:
 *         description: Forbidden - Only admins can access this endpoint
 *       500:
 *         description: Internal server error
 */
