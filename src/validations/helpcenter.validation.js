const Joi = require('joi');

const helprequest = {
    body: Joi.object().keys({
        subject: Joi.string().required(),
        message: Joi.string().required(),
    }),
};

const contactForm = {
    body: Joi.object().keys({
        name: Joi.string().required().min(3).max(100),
        email: Joi.string().email().required(),
        message: Joi.string().required().min(10).max(1000),
    }),
};

module.exports = {
    helprequest,
    contactForm,
};
