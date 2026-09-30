const Joi = require('joi');

const getPlans = {
    query: Joi.object().keys({
        limit: Joi.number().default(3).required(),
        page: Joi.number().integer(),
    }),
};

const getTransactions = {
    query: Joi.object().keys({
        limit: Joi.number().default(3).required(),
        page: Joi.number().integer(),
    }),
};
const getInvoices = {
    query: Joi.object().keys({
        limit: Joi.number().default(3).required(),
        page: Joi.number().integer(),
        customerId: Joi.string().optional(),
    }),
};

const createPlan = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        active: Joi.boolean().default(true), // Optional with default true
        description: Joi.string().allow(null, ''), // Allows null or empty string
        amount: Joi.number().integer().min(0).required(), // Amount in smallest currency unit, e.g., cents
        recurring: Joi.boolean().default(false), // Indicates if the product is recurring or one-off
        billing_period: Joi.string().valid('day', 'week', 'month', 'year').when('recurring', {
            is: true,
            then: Joi.required(),
            otherwise: Joi.forbidden(), // Only allowed if recurring is true
        }),
        interval_count: Joi.number().integer().min(1).default(1).when('recurring', {
            is: true,
            then: Joi.required(),
            otherwise: Joi.forbidden(), // Only allowed if recurring is true
        }),
        marketing_features: Joi.array().items(Joi.string()).default([]), // Default empty array
        metadata: Joi.object({
            category: Joi.string().custom((value, helpers) => {
                const validCategories = ['Basic', 'Premium']; // Valid categories
                if (!validCategories.includes(value)) {
                    return helpers.message('Invalid Category');
                }
                return value;
            }),
        }).default({}), // Default empty object
    }),
};

const createPrice = {
    body: Joi.object().keys({
        amount: Joi.number().integer().min(50).required(), // Required amount in the smallest currency unit (e.g., cents)
        currency: Joi.string().length(3).required(), // Required 3-letter currency code (e.g., "usd")
        recurring: Joi.boolean().required(), // Whether the price is recurring or one-time
        billing_period: Joi.string().valid('day', 'week', 'month', 'year').when('recurring', {
            is: true,
            then: Joi.required(),
            otherwise: Joi.forbidden(), // Only required if recurring is true
        }),
        interval_count: Joi.number().integer().min(1).default(1).when('recurring', {
            is: true,
            then: Joi.required(),
            otherwise: Joi.forbidden(), // Only required if recurring is true
        }),
    }),
    params: Joi.object().keys({
        planId: Joi.string().required(), // ID of the product for which the price is being created
    }),
};
const updatePrice = {
    body: Joi.object().keys({
        active: Joi.boolean().required(),
    }),
    params: Joi.object().keys({
        planId: Joi.string().required(), // ID of the product for which the price is being created
    }),
};

const updatePlan = {
    params: Joi.object().keys({
        planId: Joi.string(),
    }),
    body: Joi.object().keys({
        active: Joi.boolean(),
        description: Joi.string(),
        name: Joi.string(),
        marketing_features: Joi.array().items(
            Joi.object().keys({
                name: Joi.string(),
            }),
        ),
    }),
};

const subscribe = {
    body: {
        priceId: Joi.string().required(),
        promocode: Joi.string().optional(),
    },
};
const unsubscribe = {
    body: {
        action: Joi.string().custom((value, helpers) => {
            if (value !== 'immediately' && value !== 'end_of_current_period') {
                return helpers.message('Invalid action');
            }
            return value;
        }),
    },
};

const gift = {
    body: Joi.object().keys({
        recipientId: Joi.string().required(),
        priceId: Joi.string().required(),
        promocode: Joi.string().optional(),
    }),
};

const getSubscriptions = {
    query: Joi.object().keys({
        customerId: Joi.string().optional(),
        limit: Joi.number().default(10).required(),
    }),
};

const updateBehaviour = {
    body: Joi.object().keys({
        behaviour: Joi.string().valid('pause', 'resume').required(),
    }),
};
module.exports = {
    getPlans,
    createPlan,
    updatePlan,
    subscribe,
    unsubscribe,
    getTransactions,
    getInvoices,
    createPrice,
    gift,
    updatePrice,
    getSubscriptions,
    updateBehaviour,
};
