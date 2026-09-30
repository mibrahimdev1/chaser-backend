const Joi = require('joi');
const { chatContentType, mongooseIdType } = require('./custom.validation');

const sendMessage = {
    body: Joi.object().keys({
        message: Joi.string().min(1).required(),
        chatId: Joi.string().required(),
        senderId: Joi.string().required(),
        content_type: Joi.string().custom(chatContentType).required(),
        isBot: Joi.boolean().required(),
    }),
};
const report = {
    body: Joi.object().keys({
        reportedTo: Joi.string().custom(mongooseIdType).optional().description('ID of the user being reported'),
        chatId: Joi.string().custom(mongooseIdType).optional().description('ID of the chat being reported'),
        content: Joi.string().required().description('Content or reason for the report'),
        reportType: Joi.string().required().description('Type of report'),
        type: Joi.string(),
    }),
};

const addPeople = {
    body: Joi.object().keys({
        userIds: Joi.array().items(Joi.string()).min(1).required().custom(mongooseIdType),
        chatId: Joi.string().required().custom(mongooseIdType),
    }),
};
const removePeople = {
    body: Joi.object().keys({
        userId: Joi.array().items(Joi.string().custom(mongooseIdType)),
        chatId: Joi.string().required().custom(mongooseIdType),
    }),
};

const updateHuddle = {
    body: Joi.object().keys({
        chatId: Joi.string().required().custom(mongooseIdType),
        description: Joi.string().optional(),
        name: Joi.string().optional(),
        chatProfilePicture: Joi.string().optional(),
    }),
};

const addHuddle = {
    body: Joi.object().keys({
        description: Joi.string().required(),
        name: Joi.string().required(),
        members: Joi.array().items(Joi.string().required().custom(mongooseIdType)),
        chatProfilePicture: Joi.string().optional(),
    }),
};

const getHuddle = {
    query: Joi.object().keys({
        limit: Joi.number().integer().default(10),
        cursor: Joi.string().custom(mongooseIdType),
        type: Joi.string().custom((value, helpers) => {
            const enums = ['private', 'huddle'];
            if (enums.includes(value)) {
                return value;
            }
            return helpers.message('huddle is invalid');
        }),
    }),
};

const leaveChat = {
    params: Joi.object().keys({
        huddleId: Joi.string().required().custom(mongooseIdType),
    }),
    body: Joi.object().keys({
        action: Joi.string()
            .valid('block', 'leave')
            .required()
            .description('Action to perform: block or leave the chat'),
    }),
};

const getMessages = {
    params: Joi.object().keys({
        huddleId: Joi.string().required().custom(mongooseIdType),
    }),
};
module.exports = {
    leaveChat,
    sendMessage,
    report,
    addPeople,
    removePeople,
    updateHuddle,
    addHuddle,
    getHuddle,
    getMessages,
};
