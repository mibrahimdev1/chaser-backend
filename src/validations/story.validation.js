const Joi = require('joi');

const createStory = {
    body: Joi.object().keys({
        mediaUrl: Joi.string().uri().required(),
        mediaType: Joi.string().valid('image', 'video').required(),
        textContent: Joi.string().optional(),
    }),
};

const getStories = {
    query: Joi.object().keys({
        userId: Joi.string().required(),
    }),
};

const getStory = {
    params: Joi.object().keys({
        storyId: Joi.string().required(),
    }),
};

const getExpiredStories = {
    params: Joi.object().keys({
        userId: Joi.string().required(),
    }),
};

const deleteStory = {
    params: Joi.object().keys({
        storyId: Joi.string().required(),
    }),
};

module.exports = {
    getExpiredStories,
    getStory,
    getStories,
    createStory,
    deleteStory,
};
