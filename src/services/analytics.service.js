const { stripeService } = require('.');
const { User, Feed, Report } = require('../models');

// Utility functions
function getLastMonthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, 1);
}

function getLastMonthEnd() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
}

function getPrevMonthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 2, 1);
}

function getPrevMonthEnd() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
}

function calculatePercentageChange(previous, current) {
    if (previous === 0) return current === 0 ? '0' : '+100';
    const change = +(((current - previous) / previous) * 100).toFixed(2);
    return `${change > 0 ? '+' : '-'}${Math.abs(change)}`;
}

const analytics = async (metrics) => {
    const data = {};

    const promises = metrics.map(async (metric) => {
        let current = 0;
        let previous = 0;

        switch (metric) {
            case 'totalUsers': {
                const totalUsers = await User.countDocuments();

                current = await User.countDocuments({
                    createdAt: { $gte: getLastMonthStart(), $lte: getLastMonthEnd() },
                });

                previous = await User.countDocuments({
                    createdAt: { $gte: getPrevMonthStart(), $lte: getPrevMonthEnd() },
                });

                data.totalUsers = {
                    total: totalUsers,
                    lastMonth: current,
                    change: calculatePercentageChange(previous, current),
                };
                break;
            }

            case 'totalPosts': {
                const totalPosts = await Feed.countDocuments();

                current = await Feed.countDocuments({
                    createdAt: { $gte: getLastMonthStart(), $lte: getLastMonthEnd() },
                });

                previous = await Feed.countDocuments({
                    createdAt: { $gte: getPrevMonthStart(), $lte: getPrevMonthEnd() },
                });

                data.totalPosts = {
                    total: totalPosts,
                    lastMonth: current,
                    change: calculatePercentageChange(previous, current),
                };
                break;
            }

            case 'flaggedContent': {
                const totalFlags = await Report.countDocuments();

                current = await Report.countDocuments({
                    createdAt: { $gte: getLastMonthStart(), $lte: getLastMonthEnd() },
                });

                previous = await Report.countDocuments({
                    createdAt: { $gte: getPrevMonthStart(), $lte: getPrevMonthEnd() },
                });

                data.flaggedContent = {
                    total: totalFlags,
                    lastMonth: current,
                    change: calculatePercentageChange(previous, current),
                };
                break;
            }

            case 'activeSubscriptions': {
                const allActiveSubscriptions = await stripeService.listAllSubscriptions(
                    null,
                    999999999999999,
                    'active',
                );

                const totalSub = Array.isArray(allActiveSubscriptions) ? allActiveSubscriptions.length : 0;

                current = Array.isArray(allActiveSubscriptions)
                    ? allActiveSubscriptions.filter((sub) => {
                          const createdAt = new Date(sub.created || sub.createdAt * 1000);
                          return createdAt >= getLastMonthStart() && createdAt <= getLastMonthEnd();
                      }).length
                    : 0;

                previous = Array.isArray(allActiveSubscriptions)
                    ? allActiveSubscriptions.filter((sub) => {
                          const createdAt = new Date(sub.created || sub.createdAt * 1000);
                          return createdAt >= getPrevMonthStart() && createdAt <= getPrevMonthEnd();
                      }).length
                    : 0;

                data.activeSubscriptions = {
                    total: totalSub,
                    lastMonth: current,
                    change: calculatePercentageChange(previous, current),
                };
                break;
            }

            case 'monthlyRevenue': {
                // Get all active subscriptions
                const allActiveSubscriptions = await stripeService.listAllSubscriptions(
                    null,
                    999999999999999,
                    'active',
                );

                // Calculate current month revenue
                const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                const currentMonthEnd = new Date(
                    new Date().getFullYear(),
                    new Date().getMonth() + 1,
                    0,
                    23,
                    59,
                    59,
                    999,
                );

                // Calculate last month revenue
                const lastMonthStart = getLastMonthStart();
                const lastMonthEnd = getLastMonthEnd();

                // Calculate previous month revenue for comparison
                const prevMonthStart = getPrevMonthStart();
                const prevMonthEnd = getPrevMonthEnd();

                // Get invoices for revenue calculation
                const currentMonthInvoices = await stripeService.getAllInvoices(1000);
                const lastMonthInvoices = currentMonthInvoices.filter((invoice) => {
                    const invoiceDate = new Date(invoice.created * 1000);
                    return invoiceDate >= lastMonthStart && invoiceDate <= lastMonthEnd && invoice.status === 'paid';
                });

                const prevMonthInvoices = currentMonthInvoices.filter((invoice) => {
                    const invoiceDate = new Date(invoice.created * 1000);
                    return invoiceDate >= prevMonthStart && invoiceDate <= prevMonthEnd && invoice.status === 'paid';
                });

                const currentRevenue = lastMonthInvoices.reduce((sum, invoice) => sum + invoice.amount_paid / 100, 0);
                const previousRevenue = prevMonthInvoices.reduce((sum, invoice) => sum + invoice.amount_paid / 100, 0);

                data.monthlyRevenue = {
                    total: currentRevenue,
                    lastMonth: currentRevenue,
                    change: calculatePercentageChange(previousRevenue, currentRevenue),
                };
                break;
            }

            case 'avgSubscriptionValue': {
                // Get all active subscriptions
                const allActiveSubscriptionsForAvg = await stripeService.listAllSubscriptions(
                    null,
                    999999999999999,
                    'active',
                );

                // Calculate average subscription value
                const totalValue = Array.isArray(allActiveSubscriptionsForAvg)
                    ? allActiveSubscriptionsForAvg.reduce((sum, sub) => {
                          const amount = sub.items?.data?.[0]?.price?.unit_amount || 0;
                          return sum + amount / 100; // Convert from cents to dollars
                      }, 0)
                    : 0;

                const avgValue =
                    Array.isArray(allActiveSubscriptionsForAvg) && allActiveSubscriptionsForAvg.length > 0
                        ? totalValue / allActiveSubscriptionsForAvg.length
                        : 0;

                // Calculate last month's average
                const lastMonthSubscriptions = Array.isArray(allActiveSubscriptionsForAvg)
                    ? allActiveSubscriptionsForAvg.filter((sub) => {
                          const createdAt = new Date(sub.created * 1000);
                          return createdAt >= getLastMonthStart() && createdAt <= getLastMonthEnd();
                      })
                    : [];

                const lastMonthAvgValue =
                    lastMonthSubscriptions.length > 0
                        ? lastMonthSubscriptions.reduce((sum, sub) => {
                              const amount = sub.items?.data?.[0]?.price?.unit_amount || 0;
                              return sum + amount / 100;
                          }, 0) / lastMonthSubscriptions.length
                        : 0;

                // Calculate previous month's average for comparison
                const prevMonthSubscriptions = Array.isArray(allActiveSubscriptionsForAvg)
                    ? allActiveSubscriptionsForAvg.filter((sub) => {
                          const createdAt = new Date(sub.created * 1000);
                          return createdAt >= getPrevMonthStart() && createdAt <= getPrevMonthEnd();
                      })
                    : [];

                const prevMonthAvgValue =
                    prevMonthSubscriptions.length > 0
                        ? prevMonthSubscriptions.reduce((sum, sub) => {
                              const amount = sub.items?.data?.[0]?.price?.unit_amount || 0;
                              return sum + amount / 100;
                          }, 0) / prevMonthSubscriptions.length
                        : 0;

                data.avgSubscriptionValue = {
                    total: avgValue,
                    lastMonth: lastMonthAvgValue,
                    change: calculatePercentageChange(prevMonthAvgValue, lastMonthAvgValue),
                };
                break;
            }

            case 'churnRate': {
                // Get all subscriptions (active and cancelled)
                const allSubscriptions = await stripeService.listAllSubscriptions(null, 999999999999999);

                // Calculate churn rate for last month
                const lastMonthCancelled = Array.isArray(allSubscriptions)
                    ? allSubscriptions.filter((sub) => {
                          const cancelledAt = sub.canceled_at ? new Date(sub.canceled_at * 1000) : null;
                          return cancelledAt && cancelledAt >= getLastMonthStart() && cancelledAt <= getLastMonthEnd();
                      }).length
                    : 0;

                // Get active subscriptions at the beginning of last month
                const activeAtMonthStart = Array.isArray(allSubscriptions)
                    ? allSubscriptions.filter((sub) => {
                          const createdAt = new Date(sub.created * 1000);
                          return createdAt < getLastMonthStart() && (sub.status === 'active' || sub.canceled_at);
                      }).length
                    : 0;

                // Calculate churn rate
                const churnRate = activeAtMonthStart > 0 ? (lastMonthCancelled / activeAtMonthStart) * 100 : 0;

                // Calculate previous month churn for comparison
                const prevMonthCancelled = Array.isArray(allSubscriptions)
                    ? allSubscriptions.filter((sub) => {
                          const cancelledAt = sub.canceled_at ? new Date(sub.canceled_at * 1000) : null;
                          return cancelledAt && cancelledAt >= getPrevMonthStart() && cancelledAt <= getPrevMonthEnd();
                      }).length
                    : 0;

                const activeAtPrevMonthStart = Array.isArray(allSubscriptions)
                    ? allSubscriptions.filter((sub) => {
                          const createdAt = new Date(sub.created * 1000);
                          return createdAt < getPrevMonthStart() && (sub.status === 'active' || sub.canceled_at);
                      }).length
                    : 0;

                const prevChurnRate =
                    activeAtPrevMonthStart > 0 ? (prevMonthCancelled / activeAtPrevMonthStart) * 100 : 0;

                data.churnRate = {
                    total: churnRate,
                    lastMonth: churnRate,
                    change: calculatePercentageChange(prevChurnRate, churnRate),
                };
                break;
            }

            default:
                break;
        }
    });

    await Promise.all(promises);
    return data;
};

const revenueOverview = async () => {
    return {
        subscriptionRevenue: 0,
        adRevenue: 0,
        totalRevenue: 0,
        boostedPostsRevenue: 0,
    };
};

/**
 * Get comprehensive subscription analytics
 * @returns {Promise<Object>} Subscription analytics data
 */
const getSubscriptionAnalytics = async () => {
    const subscriptionMetrics = ['activeSubscriptions', 'monthlyRevenue', 'avgSubscriptionValue', 'churnRate'];

    const analyticsData = await analytics(subscriptionMetrics);

    return {
        activeSubscriptions: analyticsData.activeSubscriptions,
        monthlyRevenue: analyticsData.monthlyRevenue,
        avgSubscriptionValue: analyticsData.avgSubscriptionValue,
        churnRate: analyticsData.churnRate,
        generatedAt: new Date().toISOString(),
    };
};

module.exports = { analytics, revenueOverview, getSubscriptionAnalytics };
