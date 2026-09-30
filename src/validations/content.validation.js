const Joi = require('joi');
const { contentType } = require('./custom.validation');

const addContent = {
    body: Joi.object().keys({
        content: Joi.object().required(),
        content_type: Joi.string().required().custom(contentType),
    }),
};
const getContent = {
    query: Joi.object().keys({
        content_type: Joi.string().required().custom(contentType),
    }),
};

const updateContent = {
    body: Joi.object().keys({
        content: Joi.object().required(),
        content_type: Joi.string().required().custom(contentType),
    }),
};

module.exports = {
    addContent,
    getContent,
};
