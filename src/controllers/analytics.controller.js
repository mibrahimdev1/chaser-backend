const analyticsService = require('../services/analytics.service');
const catchAsync = require('../utils/catchAsync');

const analytics = catchAsync(async (req, res) => {
    const { metrics = [] } = req.body;
    const result = await analyticsService.analytics(metrics);
    res.send(result);
});

const revenueOverview = catchAsync(async (req, res) => {
    const result = await analyticsService.revenueOverview();
    res.send(result);
});

const subscriptionAnalytics = catchAsync(async (req, res) => {
    const result = await analyticsService.getSubscriptionAnalytics();
    res.send(result);
});

module.exports = {
    analytics,
    revenueOverview,
    subscriptionAnalytics,
};
