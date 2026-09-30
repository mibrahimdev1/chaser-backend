const Joi = require('joi');
const { password } = require('./custom.validation');

const register = {
    body: Joi.object().keys({
        displayName: Joi.string().required(),
        firstName: Joi.string().allow('').optional(),
        lastName: Joi.string().allow('').optional(),
        username: Joi.string().allow('').optional().trim().lowercase(),
        dob: Joi.date().optional(),
        email: Joi.string().required().email(),
        password: Joi.string().required().custom(password),
        fcmToken: Joi.string().optional(),
    }),
};

const login = {
    body: Joi.object().keys({
        email: Joi.string().required(),
        password: Joi.string().required(),
        fcmToken: Joi.string().optional(),
    }),
};

const logout = {
    body: Joi.object().keys({
        refreshToken: Joi.string().required(),
    }),
};

const refreshTokens = {
    body: Joi.object().keys({
        refreshToken: Joi.string().required(),
    }),
};

const forgotPassword = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
    }),
};

const resetPassword = {
    query: Joi.object().keys({
        token: Joi.string().required(),
    }),
    body: Joi.object().keys({
        password: Joi.string().required().custom(password),
    }),
};

const verifyEmail = {
    body: Joi.object().keys({
        token: Joi.string().required(),
        otp: Joi.string().required(),
    }),
};

const googleAuth = {
    body: Joi.object().keys({
        action: Joi.string().required(),
        token: Joi.string().required(),
        fcmToken: Joi.alternatives().try(Joi.string(), Joi.valid(null)).optional(),
    }),
};

module.exports = {
    register,
    login,
    logout,
    refreshTokens,
    forgotPassword,
    resetPassword,
    verifyEmail,
    googleAuth,
};
