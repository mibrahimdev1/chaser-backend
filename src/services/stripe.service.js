const httpStatus = require('http-status');
const config = require('../config/config');
const stripe = require('stripe')(config.stripe.secretKey);
const { GiftSubscription } = require('../models');
const ApiError = require('../utils/ApiError');

const addCustomer = async (name, email) => {
    const customer = await stripe.customers.create({
        name,
        email,
    });
    return customer;
};

const createCheckout = async (lineItems, mode = 'payment', successUrl, cancelUrl, metadata, customerId) => {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode,
        metadata,
        success_url: successUrl,
        cancel_url: cancelUrl,
        invoice_creation: {
            enabled: true,
            invoice_data: {
                metadata,
            },
        },
        customer: customerId,
    });

    return session;
};

const deleteCustomer = async (id) => {
    const deleted = await stripe.customers.del(id);
    return deleted;
};

const updateCustomer = async (id, body) => {
    const customer = await stripe.customers.update(id, {
        ...body,
    });
    return customer;
};
// PRODUCT / PLANS

const createProduct = async (payload) => {
    const product = await stripe.products.create({
        name: payload.name,
        description: payload.description,
        active: payload.active,
        metadata: payload.metadata,
    });

    const priceData = {
        unit_amount: payload.amount * 100, // Amount in cents
        currency: 'usd', // Currency code
        product: product.id,
    };

    if (payload.recurring) {
        priceData.recurring = {
            interval: payload.billing_period, // 'day', 'week', 'month', 'year'
            interval_count: payload.interval_count,
        };
    }
    await stripe.prices.create(priceData);
    // const product = await stripe.products.create({ ...payload });
    return product;
};

const createPrice = async (payload) => {
    const price = await stripe.prices.create({
        product: payload.planId,
        unit_amount: payload.amount * 100, // Amount in the smallest currency unit (e.g., cents)
        currency: payload.currency,
        recurring: payload.recurring
            ? {
                  interval: payload.billing_period,
                  interval_count: payload.interval_count,
              }
            : undefined, // Include recurring details only if it's a recurring price
    });

    return price;
};

const updateProduct = async (id, payload) => {
    // console.log(id, payload);
    const product = await stripe.products.update(id, {
        ...payload,
    });
    return product;
};

const retrieveProduct = async (id) => {
    const product = await stripe.products.retrieve(id);
    return product;
};

const listAllProduct = async (limit) => {
    const products = await stripe.products.list({
        limit,
        active: true,
    });
    return products;
};

const getPricesForProduct = async (productId, active) => {
    if (active) {
        const prices = await stripe.prices.list({
            product: productId,
            limit: 100, // Adjust the limit as needed,
            active: true,
        });

        return prices.data;
    }
    const prices = await stripe.prices.list({
        product: productId,
        limit: 100, // Adjust the limit as needed,
    });

    return prices.data;
};

const deleteProduct = async (id) => {
    const deleted = await stripe.products.del(id);
    return deleted;
};

const getCustomerPaymentMethods = async (id, limit) => {
    const paymentMethods = await stripe.customers.listPaymentMethods(id, {
        limit,
    });
    return paymentMethods;
};

const addPaymentMethod = async (payload) => {
    const paymentMethod = await stripe.paymentMethods.create({
        ...payload,
    });
    return paymentMethod;
};

const attachCustomerPaymentMethod = async (customer_id, payment_method_id) => {
    const paymentMethod = await stripe.paymentMethods.attach(payment_method_id, {
        customer: customer_id,
    });
    await stripe.customers.update(customer_id, {
        invoice_settings: {
            default_payment_method: payment_method_id,
        },
    });
    return paymentMethod;
};

/**
 * Unsubscribe function
 * @param {string} subscriptionId - The ID of the subscription to unsubscribe from
 * @param {string} action - The action to take ("immediately" or "end_of_current_period")
 * @returns {Promise<void>}
 */

const unsubscribe = async (subscriptionId, action) => {
    if (action === 'immediately') {
        // Cancel the subscription immediately
        await stripe.subscriptions.cancel(subscriptionId);
        // console.log('Subscription canceled immediately');
    } else if (action === 'end_of_current_period') {
        await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });
    }
};

const getPriceById = async (priceId) => {
    const price = await stripe.prices.retrieve(priceId);
    return price;
};

const listUserSubscriptions = async (customerId, active) => {
    const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: active ? 'active' : 'all',
        limit: 9999999,
    });
    return subscriptions;
};

const listAllSubscriptions = async (customerId, limit, active = null) => {
    const queryobj = {
        limit,
        expand: ['data.customer', 'data.plan.product', 'data.latest_invoice'],
    };
    if (customerId) {
        queryobj.customer = customerId;
    }
    if (active) {
        queryobj.status = active;
    }
    const subscriptions = await stripe.subscriptions.list(queryobj);

    const subscriptionsWithInvoiceLink = subscriptions.data.map((subscription) => {
        const invoiceUrl = subscription.latest_invoice ? subscription.latest_invoice.invoice_pdf : null;
        return { ...subscription, invoiceUrl };
    });

    return subscriptionsWithInvoiceLink;
};

// const subscribe = async (customer_id, price_id, promocode) => {
//   if (promocode) {
//     let finalCode = promocode;
//     const promotionCodes = await stripe.promotionCodes.list({
//       limit: 1,
//       code: promocode,
//     });
//     if (promotionCodes.data) {
//       finalCode = promotionCodes.data[0].id;
//     }
//     const subscription = await stripe.subscriptions.create({
//       customer: customer_id,
//       items: [
//         {
//           price: price_id,
//         },
//       ],
//       discounts: [
//         {
//           promotion_code: finalCode,
//         },
//       ],
//     });
//     return subscription;
//   }
//   const subscription = await stripe.subscriptions.create({
//     customer: customer_id,
//     items: [
//       {
//         price: price_id,
//       },
//     ],
//   });
//   return subscription;
// };

const subscribe = async (customer_id, price_id, promocode) => {
    // try {
    // Create a Checkout Session for the subscription
    const session = await stripe.checkout.sessions.create({
        customer: customer_id,
        payment_method_types: ['card'],
        line_items: [
            {
                price: price_id,
                quantity: 1,
            },
        ],
        mode: 'subscription', // Set mode to subscription
        success_url: 'https://chaser.com/success', // Redirect URL after successful payment
        cancel_url: 'https://chaser.com/cancel', // Redirect URL if the user cancels
        discounts: promocode
            ? [
                  {
                      coupon: promocode, // Apply promo code if provided
                  },
              ]
            : [],
    });

    // Return the Checkout Session URL
    return { url: session.url };
    // } catch (error) {
    // console.error('Error creating Checkout Session:', error);
    // throw error;
    // }
};
const checkSubscription = async (customerId) => {
    const subscriptions = await listUserSubscriptions(customerId, true);

    const hasActiveSubscription = subscriptions.data.length > 0;

    return { data: hasActiveSubscription ? subscriptions.data : null, hasActiveSubscription };
};

const getAllTransactions = async (limit, customerId) => {
    const obj = { limit };
    if (customerId) {
        obj.customer = customerId;
    }
    const transactions = await stripe.balanceTransactions.list(obj);
    return transactions.data;
};

const getAllInvoices = async (limit, customerId) => {
    const invoices = await stripe.invoices.list({
        limit,
        customer: customerId || undefined,
    });

    return invoices.data;
};
const getCustomerInvoices = async (limit, customerId) => {
    const payload = { limit };
    if (customerId) {
        payload.customer = customerId;
    }
    const invoices = await stripe.invoices.list(payload);
    return invoices.data;
};

const createCoupon = async ({ percent_off, duration, duration_in_months, max_redemptions, planId }) => {
    const obj = { percent_off, duration, max_redemptions };
    if (planId) {
        obj.applies_to = {
            products: [planId],
        };
    }
    if (duration === 'repeating') {
        obj.duration_in_months = duration_in_months;
    }
    const coupon = await stripe.coupons.create(obj);
    return coupon;
};

// promo code

const createPromoCode = async (coupon, code, max_redemptions, metadata) => {
    const promotionCode = await stripe.promotionCodes.create({
        coupon,
        code,
        max_redemptions,
        metadata,
    });
    return promotionCode;
};
const updatePromoCode = async (promoId, active) => {
    const promotionCode = await stripe.promotionCodes.update(promoId, {
        active,
    });
    return promotionCode;
};

const retrievePromoCode = async (promoId) => {
    const promotionCode = await stripe.promotionCodes.retrieve(promoId);
    return promotionCode;
};

const promoCodes = async (limit) => {
    const promotionCodes = await stripe.promotionCodes.list({
        limit,
        active: true,
    });
    return promotionCodes;
};

const updateCoupon = async (promoId, active) => {
    const promotionCode = await stripe.promotionCodes.update(promoId, {
        active,
    });
    return promotionCode;
};

const retrieveCoupon = async (couponId) => {
    const coupon = await stripe.coupons.retrieve(couponId);
    return coupon;
};

const coupons = async (limit) => {
    const couponsObj = await stripe.coupons.list({
        limit,
    });
    return couponsObj.data;
};

const deleteCoupon = async (couponId) => {
    const deleted = await stripe.coupons.del(couponId);
    return deleted;
};

const getInvoices = async () => {
    const totalPayments = await stripe.paymentIntents.list({
        limit: 100, // Adjust this limit based on your needs
    });
    return totalPayments;
};
const storeGiftedSubscription = async (recipientId, subscriptionId, priceId, status, resumeAt, senderId) => {
    const newGift = new GiftSubscription({
        recipientId,
        giftSubscriptionId: subscriptionId,
        priceId,
        status,
        resumeAt,
        senderId,
    });
    await newGift.save();
    return newGift;
};
const giftSubscription = async (customerId, priceId, recipientId, promocode) => {
    try {
        // List active subscriptions for the recipient
        const recipientSubscriptions = await stripe.subscriptions.list({
            customer: recipientId,
            status: 'active',
            limit: 1,
        });

        let response;
        if (recipientSubscriptions.data.length === 0) {
            // No active subscriptions for the recipient, create a new subscription immediately
            if (promocode) {
                let finalCode = promocode;
                const promotionCodes = await stripe.promotionCodes.list({
                    limit: 1,
                    code: promocode,
                });
                if (promotionCodes.data) {
                    finalCode = promotionCodes.data[0].id;
                } else {
                    throw ApiError(httpStatus.BAD_REQUEST, 'Promo code is invalid');
                }

                response = await stripe.subscriptions.create({
                    customer: recipientId,
                    items: [{ price: priceId }],
                    discounts: [
                        {
                            promotion_code: finalCode,
                        },
                    ],
                });
            } else {
                response = await stripe.subscriptions.create({
                    customer: recipientId,
                    items: [{ price: priceId }],
                });
            }
            await storeGiftedSubscription(recipientId, response.id, priceId, 'active', null, customerId);
        } else {
            // Active subscription found, create a new subscription and pause it
            const currentSubscription = recipientSubscriptions.data[0];
            const currentSubscriptionEnd = currentSubscription.current_period_end;
            if (promocode) {
                let finalCode = promocode;
                const promotionCodes = await stripe.promotionCodes.list({
                    limit: 1,
                    code: promocode,
                });
                if (promotionCodes.data) {
                    finalCode = promotionCodes.data[0].id;
                } else {
                    throw ApiError(httpStatus.BAD_REQUEST, 'Promo code is invalid');
                }
                response = await stripe.subscriptions.create({
                    customer: recipientId,
                    items: [{ price: priceId }],
                    discounts: [
                        {
                            promotion_code: finalCode,
                        },
                    ],
                });
            } else {
                response = await stripe.subscriptions.create({
                    customer: recipientId,
                    items: [{ price: priceId }],
                });
            }
            await stripe.subscriptions.update(response.id, {
                pause_collection: {
                    behavior: 'mark_uncollectible',
                    resumes_at: currentSubscriptionEnd,
                },
            });

            await storeGiftedSubscription(
                recipientId,
                response.id,
                priceId,
                'paused',
                currentSubscriptionEnd,
                customerId,
            );
        }

        return {
            success: true,
            message: 'Gift subscription processed successfully.',
            subscription: response,
        };
    } catch (error) {
        return {
            success: false,
            message: `Error processing gift subscription: ${error.message}`,
        };
    }
};

const updatePrice = async (payload) => {
    const price = await stripe.prices.update(payload.planId, {
        active: payload.active,
    });
    return price;
};

const validatePromoCode = async (code, planId) => {
    let promocode = null;
    const promotionCodes = await stripe.promotionCodes.list({
        limit: 1,
        code,
    });
    if (promotionCodes.data.length) {
        promocode = { ...promotionCodes.data[0] };
        if (
            !promocode ||
            !promocode.coupon ||
            !promocode.coupon.valid ||
            !(promocode.coupon.max_redemptions >= promocode.coupon.times_redeemed)
        ) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot redeem');
        }
        if (planId && promocode.metadata && promocode.metadata.planId && promocode.metadata.planId !== planId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Promocode is invalid for this plan');
        }
    } else {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Promocode is expired or invalid');
    }
    return { percentageOff: promocode.coupon.percent_off };
};

const updateSubscriptionBehaviour = async (subscriptionId, behavior) => {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
        pause_collection: behavior
            ? {
                  behavior,
              }
            : null,
    });

    return subscription;
};
module.exports = {
    getInvoices,
    createCheckout,
    validatePromoCode,
    coupons,
    retrieveCoupon,
    updateCoupon,
    createCoupon,
    deleteCoupon,
    createPromoCode,
    updatePromoCode,
    retrievePromoCode,
    promoCodes,
    addCustomer,
    deleteCustomer,
    updateCustomer,
    listAllProduct,
    createProduct,
    updateProduct,
    retrieveProduct,
    deleteProduct,
    addPaymentMethod,
    getCustomerPaymentMethods,
    attachCustomerPaymentMethod,
    subscribe,
    unsubscribe,
    checkSubscription,
    getPriceById,
    listUserSubscriptions,
    listAllSubscriptions,
    getPricesForProduct,
    getAllTransactions,
    getAllInvoices,
    createPrice,
    giftSubscription,
    updatePrice,
    getCustomerInvoices,
    updateSubscriptionBehaviour,
};
