const Joi = require('joi');
const { mongooseIdType } = require('./custom.validation');

const createGroup = {
    body: Joi.object().keys({
        profilePicture: Joi.string().trim().uri().optional(),
        coverPicture: Joi.string().trim().uri().optional(),
        name: Joi.string().trim().max(100).required(),
        description: Joi.string().trim().max(500).required(),
        industry: Joi.string().trim().max(100).optional(),
        location: Joi.string().trim().max(100).optional(),
        rules: Joi.string().trim().max(1000).optional(),
        groupType: Joi.string().valid('public', 'private').default('public'),
        permissions: Joi.object({
            allowMemberInvites: Joi.boolean().default(true),
            requirePostApproval: Joi.boolean().default(false),
        }).optional(),
    }),
};

const getGroup = {
    params: Joi.object().keys({
        groupId: Joi.string().custom(mongooseIdType).required(),
    }),
};

const addMember = {
    params: Joi.object().keys({
        groupId: Joi.string().custom(mongooseIdType).required(),
        userId: Joi.string().custom(mongooseIdType).required(),
    }),
};

const getAllGroups = {
    query: Joi.object().keys({
        page: Joi.number().default(1).required(),
        limit: Joi.number().default(10).required(),
        forUser: Joi.boolean().default(false).optional(),
    }),
};
// const searchGroup = {
//   query: Joi.object({}),
// };
const updateGroup = {
    params: Joi.object().keys({
        groupId: Joi.string().custom(mongooseIdType).required(),
    }),
    body: Joi.object().keys({
        profilePicture: Joi.string().trim().uri().optional(),
        coverPicture: Joi.string().trim().uri().optional(),
        name: Joi.string().trim().max(100).optional(),
        description: Joi.string().trim().max(500).optional(),
        industry: Joi.string().trim().max(100).optional(),
        location: Joi.string().trim().max(100).optional(),
        rules: Joi.string().trim().max(1000).optional(),
        groupType: Joi.string().valid('public', 'private').optional(),
        permissions: Joi.object({
            allowMemberInvites: Joi.boolean().optional(),
            requirePostApproval: Joi.boolean().optional(),
        }).optional(),
        admins: Joi.array()
            .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
            .optional(),
        members: Joi.array()
            .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
            .optional(),
    }),
};

const joinGroup = {
    params: Joi.object().keys({
        groupId: Joi.string().custom(mongooseIdType).required(),
    }),
};

const leaveGroup = {
    params: Joi.object().keys({
        groupId: Joi.string().custom(mongooseIdType).required(),
    }),
};

module.exports = { createGroup, getGroup, updateGroup, getAllGroups, addMember, joinGroup, leaveGroup };
