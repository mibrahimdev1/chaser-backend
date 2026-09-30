const Joi = require('joi');
const { mongooseIdType } = require('./custom.validation');

const getEvents = {
    query: Joi.object().keys({
        limit: Joi.number().default(10),
        page: Joi.number().default(1),
    }),
};
const createEvent = {
    body: Joi.object().keys({
        title: Joi.string().required(),
        date: Joi.date().required(),
        time: Joi.string().required(),
        endDate: Joi.date(),
        endTime: Joi.string(),
        location: Joi.string().allow(null, '').optional(),
        price: Joi.number().required(),
        eventType: Joi.string().valid('online', 'inperson').default('inperson').required(),
        description: Joi.string(),
        eventUrl: Joi.string().uri().allow(null),
        attendees: Joi.array().items(Joi.string().custom(mongooseIdType)),
        organizedBy: Joi.string().required().custom(mongooseIdType),
        interested: Joi.array().items(Joi.string().custom(mongooseIdType)),
        notInterested: Joi.array().items(Joi.string().custom(mongooseIdType)),
        imageUrl: Joi.string().required(),
    }),
};
const getEvent = {
    params: Joi.object().keys({
        eventId: Joi.string().custom(mongooseIdType).required(),
    }),
};
const updateEvent = {
    params: Joi.object().keys({
        eventId: Joi.string().custom(mongooseIdType).required(),
    }),
    body: Joi.object()
        .keys({
            title: Joi.string(),
            date: Joi.date(),
            time: Joi.string(),
            endDate: Joi.date(),
            endTime: Joi.string(),
            location: Joi.string(),
            price: Joi.number(),
            eventType: Joi.string().valid('online', 'inperson'),
            description: Joi.string(),
            eventUrl: Joi.string().uri().allow(null),
            attendees: Joi.array().items(Joi.string().custom(mongooseIdType)),
            organizedBy: Joi.string().custom(mongooseIdType),
            interested: Joi.array().items(Joi.string().custom(mongooseIdType)),
            notInterested: Joi.array().items(Joi.string().custom(mongooseIdType)),
            imageUrl: Joi.string(),
        })
        .min(1),
};

const deleteEvent = {
    params: Joi.object().keys({
        eventId: Joi.string().custom(mongooseIdType).required(),
    }),
};

const shareOnFeed = {
    params: Joi.object().keys({
        eventId: Joi.string().custom(mongooseIdType).required(),
    }),
    body: Joi.object().keys({
        groupId: Joi.string().custom(mongooseIdType).optional(),
        companyId: Joi.string().custom(mongooseIdType).optional(),
    }),
};

const updateIntent = {
    params: Joi.object().keys({
        eventId: Joi.string().custom(mongooseIdType).required(),
    }),
    body: {
        action: Joi.string()
            .custom((value, helpers) => {
                const enums = ['interested', 'notInterested'];
                if (enums.includes(value)) {
                    return value;
                }
                return helpers.message('Intent type is invalid. It can only be interested or notInterested.');
            })
            .required(),
    },
};
module.exports = {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    updateIntent,
    shareOnFeed,
};
