const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createCompany = {
    body: Joi.object().keys({
        name: Joi.string().min(3).max(100).required(),
        tagline: Joi.string().max(255).allow(''),
        about: Joi.string().max(500).allow(''),
        profilePicture: Joi.string().uri().allow(''),
        coverImage: Joi.string().uri().allow(''),
        companySize: Joi.string().valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+').required(),
        websiteUrl: Joi.string().uri().allow(''),
        category: Joi.string().required(),
        state: Joi.string().required(),
        city: Joi.string().required(),
        country: Joi.string().required(),
        zipcode: Joi.string()
            .optional()
            .trim()
            .regex(/^\d{4,10}$/),
        industry: Joi.string().required(),
        location: Joi.string().required(),
    }),
};

const getCompanies = {
    params: Joi.object().keys({
        search: Joi.string().max(100).optional(),
        userId: Joi.string().optional(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
    }),
};

const updateCompany = {
    params: Joi.object().keys({
        companyId: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object()
        .keys({
            name: Joi.string().min(3).max(100).optional(),
            tagline: Joi.string().max(255).allow('').optional(),
            about: Joi.string().max(500).allow('').optional(),
            profilePicture: Joi.string().uri().allow('').optional(),
            coverImage: Joi.string().uri().allow('').optional(),
            size: Joi.string().valid('1-10', '11-50', '51-200', '201-500', '500+').optional(),
            websiteUrl: Joi.string().uri().allow('').optional(),
            industry: Joi.string().optional(),
            location: Joi.string().optional(),
            country: Joi.string().optional(),
            city: Joi.string().optional(),
            state: Joi.string().optional(),
            zipcode: Joi.string()
                .optional()
                .trim()
                .regex(/^\d{4,10}$/),
            verificationStatus: Joi.string().valid('pending', 'verified').optional(),
            status: Joi.string().valid('active', 'inactive').optional(),
        })
        .min(1),
};

module.exports = {
    createCompany,
    getCompanies,
    updateCompany,
};
