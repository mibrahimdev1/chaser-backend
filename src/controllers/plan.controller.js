const httpStatus = require('http-status');
const { stripeService, userService } = require('../services');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');
// const { sendWelcomeEmail, sendEmail } = require('../services/email.service');
const { rearrangePrices } = require('../utils/others');
const stripe = require('stripe')(config.stripe.secretKey);

const getPlans = catchAsync(async (req, res) => {
    const result = await stripeService.listAllProduct(req.query.limit);

    const showActive = req.user.role === 'user';
    const productsWithPrices = await Promise.all(
        result.data.map(async (product) => {
            const prices = await stripeService.getPricesForProduct(product.id, showActive);
            return { ...product, prices };
        }),
    );
    res.send(rearrangePrices(productsWithPrices));
});

const createPlan = catchAsync(async (req, res) => {
    const plan = await stripeService.createProduct(req.body);
    res.status(httpStatus.CREATED).send(plan);
});
const createPrice = catchAsync(async (req, res) => {
    const price = await stripeService.createPrice({ ...req.body, ...req.params });
    res.status(httpStatus.CREATED).send(price);
});
const updatePrice = catchAsync(async (req, res) => {
    await stripeService.updatePrice({ ...req.body, ...req.params });
    res.status(httpStatus.NO_CONTENT).send();
});

const updatePlan = catchAsync(async (req, res) => {
    // console.log(req.params);
    const plan = await stripeService.updateProduct(req.params.planId, req.body);
    res.send(plan);
});

const unsubscribe = catchAsync(async (req, res) => {
    // console.log(req.user);
    const { stripe_customer_id } = req.user;
    // const user = await userService.getUserById(req.user.id);
    // if (!user) {
    //   throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    // }
    const subscriptions = await stripeService.listUserSubscriptions(stripe_customer_id, true);
    if (subscriptions.data.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'No active subscriptions found for this customer');
    }
    const subscription = subscriptions.data[0];
    await stripeService.unsubscribe(subscription.id, req.body.action);

    res.send();
});

const subscribe = catchAsync(async (req, res) => {
    if (!req.user.stripe_customer_id) {
        const { id: stripe_customer_id } = await stripeService.addCustomer(
            `${req.user.firstName}${req.user.lastName}`,
            req.user.email,
        );
        req.user = await userService.updateUserById(req.user.id, { ...req.user, stripe_customer_id });
    }
    const { hasActiveSubscription } = await stripeService.checkSubscription(req.user.stripe_customer_id);
    if (hasActiveSubscription) {
        res.status(httpStatus.FORBIDDEN).send({ message: 'User is already subscribed to plan. Unsubscribe first.' });
        return;
    }
    if (req.body.promocode) {
        // try {
        const pc = await stripe.promotionCodes.list({
            limit: 1,
            code: req.body.promocode,
        });
        if (!pc.data.length) {
            res.status(httpStatus.FORBIDDEN).send({ message: 'Promocode is invalid' });
            return;
        }
        // } catch (error) {
        //   console.log(error);
        // }
    }
    const subscription = await stripeService.subscribe(
        req.user.stripe_customer_id,
        req.body.priceId,
        req.body.promocode,
    );
    res.status(httpStatus.CREATED).send(subscription);
});

const getTransactions = catchAsync(async (req, res) => {
    const transactions = await stripeService.getAllTransactions(req.query.limit);
    res.status(httpStatus.OK).send({ transactions });
});

const getInvoices = catchAsync(async (req, res) => {
    const invoices = await stripeService.getAllInvoices(req.query.limit, req.query.customerId);
    res.status(httpStatus.OK).send({ invoices });
});

const giftSubscription = catchAsync(async (req, res) => {
    const { priceId, recipientId, promocode } = req.body;
    // console.log(req.body);
    const user = await userService.getUserById(recipientId);
    const result = await stripeService.giftSubscription(
        req.user.stripe_customer_id,
        priceId,
        user.stripe_customer_id,
        promocode,
    );
    if (result.subscription) {
        // const { notificationService } = require('../services');
        // try {
        //   await notificationService.sendNotification(user.fcmToken, {
        //     userId: user.id,
        //     title: `${req.user.name} has sent you a gift subscription`,
        //     message: 'Active your gift now!',
        //     giftNotification: true,
        //   });
        // } catch (e) {
        //   return res.status(httpStatus.INTERNAL_SERVER_ERROR).send();
        // }
        // await sendEmail(
        //   user.email,
        //   'Someone Gifted you a subscription!',
        //   `
        //   Hurray!
        //   You got a new subscription from your friend ${req.user.name}!
        //   Subscription Detail:
        //     Plan: ${result?.subscription?.plan?.interval_count} ${result?.subscription?.plan?.interval}
        //   `
        // );
    }
    res.status(httpStatus.OK).send(result);
});

const getSuscriptions = catchAsync(async (req, res) => {
    const { limit = 10, customerId } = req.query;
    const subscriptions = await stripeService.listAllSubscriptions(customerId, limit);
    return res.status(httpStatus.OK).send(subscriptions);
});

const updateBehaviour = catchAsync(async (req, res) => {
    const { subscriptionId } = req.params;
    const { behaviour } = req.body;
    const subscription = await stripeService.updateSubscriptionBehaviour(
        subscriptionId,
        behaviour === 'pause' ? 'keep_as_draft' : null,
    );
    return res.status(httpStatus.OK).send(subscription);
});
module.exports = {
    getPlans,
    createPlan,
    updatePlan,
    subscribe,
    unsubscribe,
    getTransactions,
    getInvoices,
    createPrice,
    giftSubscription,
    updatePrice,
    getSuscriptions,
    updateBehaviour,
};
