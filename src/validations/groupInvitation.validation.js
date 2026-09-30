const Joi = require('joi');
const { mongooseIdType } = require('./custom.validation');

const inviteMember = {
    params: Joi.object().keys({
        groupId: Joi.string().custom(mongooseIdType).required(),
        userId: Joi.string().custom(mongooseIdType).required(),
    }),
};

const acceptInvitation = {
    params: Joi.object().keys({
        invitationId: Joi.string().custom(mongooseIdType).required(),
    }),
};

const rejectInvitation = {
    params: Joi.object().keys({
        invitationId: Joi.string().custom(mongooseIdType).required(),
    }),
};

const cancelInvitation = {
    params: Joi.object().keys({
        invitationId: Joi.string().custom(mongooseIdType).required(),
    }),
};

const getInvitations = {
    query: Joi.object().keys({
        page: Joi.number().default(1).optional(),
        limit: Joi.number().default(10).optional(),
        status: Joi.string().valid('pending', 'accepted', 'rejected', 'cancelled').optional(),
    }),
};

const getGroupInvitations = {
    params: Joi.object().keys({
        groupId: Joi.string().custom(mongooseIdType).required(),
    }),
    query: Joi.object().keys({
        page: Joi.number().default(1).optional(),
        limit: Joi.number().default(10).optional(),
        status: Joi.string().valid('pending', 'accepted', 'rejected', 'cancelled').optional(),
    }),
};

const getInvitation = {
    params: Joi.object().keys({
        invitationId: Joi.string().custom(mongooseIdType).required(),
    }),
};

module.exports = {
    inviteMember,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation,
    getInvitations,
    getGroupInvitations,
    getInvitation,
};
