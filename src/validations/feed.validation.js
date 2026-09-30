const Joi = require('joi');
const { objectId } = require('./custom.validation');

const getFeeds = {
    query: Joi.object().keys({
        userId: Joi.string().optional().trim(),
        groupId: Joi.string().optional().trim(),
        companyId: Joi.string().optional().trim(),
        postType: Joi.string().valid('job', 'event', 'celebrate', 'video', 'poll', 'media', 'default').optional(),
        search: Joi.string().optional().trim(),
        limit: Joi.number().integer().min(1).max(100).optional().default(10),
        cursor: Joi.string().optional().trim(),
        page: Joi.number().integer().min(1).optional(),
    }),
};

const mediaSchema = Joi.object({
    url: Joi.string().uri().allow(null).required(),
    type: Joi.string().valid('image', 'video', 'gif', 'document').allow(null).required(),
    name: Joi.string().allow(null).optional(),
});
const pollSchema = Joi.object({
    question: Joi.string().trim().max(255).required(),
    options: Joi.array().items(Joi.string().trim().max(100)).min(2).max(5).required(),
});

const createPost = {
    body: Joi.object().keys({
        isReel: Joi.boolean().optional(),
        isPublic: Joi.boolean().optional(),
        postType: Joi.string().required().default('default'),
        companyId: Joi.string().hex().length(24).optional(),
        groupId: Joi.string().hex().length(24).optional(),
        caption: Joi.string().trim().max(5000).optional(),
        media: Joi.array().items(mediaSchema).optional(),
        poll: pollSchema.optional(),
        tags: Joi.array()
            .items(
                Joi.object({
                    id: Joi.string().required(),
                    type: Joi.string().valid('user', 'company', 'group').required(),
                    displayName: Joi.string().required(),
                    fcmToken: Joi.string().optional(),
                }),
            )
            .optional()
            .default([]),
        status: Joi.string().valid('published', 'scheduled', 'draft').default('published'),
        scheduledAt: Joi.date().greater('now').optional(),
        createdAt: Joi.date().optional(),
    }),
};

const updatePost = {
    params: Joi.object().keys({
        postId: Joi.string().custom(objectId),
    }),
    body: Joi.object().keys({
        isReel: Joi.boolean().optional(),
        isPublic: Joi.boolean().optional(),
        postType: Joi.string().optional(),
        companyId: Joi.string().hex().length(24).optional(), // Optional: If the post is associated with a company
        groupId: Joi.string().hex().length(24).optional(), // Optional: If the post is associated with a Group
        caption: Joi.string().trim().max(5000).optional(), // Caption limit to 5000 characters
        media: Joi.array().items(mediaSchema).optional(), // Array of media objects
        poll: pollSchema.optional(), // Poll object validation
        tags: Joi.array()
            .items(
                Joi.object({
                    id: Joi.string().required(),
                    type: Joi.string().valid('user', 'company', 'group').required(),
                    displayName: Joi.string().required(),
                    fcmToken: Joi.string().optional(),
                }),
            )
            .optional()
            .default([]),
        status: Joi.string().valid('published', 'scheduled', 'draft').optional(),
        scheduledAt: Joi.date().greater('now').optional(), // Scheduled date must be in the future
    }),
};
const searchEngine = {
    query: Joi.object().keys({
        query: Joi.string().required(),
    }),
};
module.exports = {
    getFeeds,
    updatePost,
    createPost,
    searchEngine,
};
