const Joi = require('joi');

const createJob = {
    body: Joi.object().keys({
        companyId: Joi.string().required(),
        title: Joi.string().required().trim(),
        description: Joi.string().required().trim(),
        location: Joi.string().trim().optional(),
        jobType: Joi.string().valid('Full-time', 'Part-time', 'Remote', 'Contract').required(),
        industry: Joi.string().optional(),
        experienceLevel: Joi.string().valid('Internship', 'Entry', 'Mid', 'Senior', 'Director').optional(),
        skillsRequired: Joi.array().items(Joi.string()).optional(),
        salary: Joi.object()
            .keys({
                min: Joi.number().optional(),
                max: Joi.number().optional(),
                currency: Joi.string().default('USD'),
                payType: Joi.string().valid('Hourly', 'Monthly', 'Yearly').required(),
            })
            .optional(),
        tags: Joi.array().items(Joi.string()).optional(),
        isFeatured: Joi.boolean().optional(),
        isActive: Joi.boolean().default(true).optional(),
        expiresAt: Joi.date().optional(),
    }),
};

const updateJob = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
    body: Joi.object().keys({
        title: Joi.string().trim().optional(),
        description: Joi.string().trim().optional(),
        location: Joi.string().trim().optional(),
        jobType: Joi.string().valid('Full-time', 'Part-time', 'Remote', 'Contract').optional(),
        industry: Joi.string().optional(),
        experienceLevel: Joi.string().valid('Internship', 'Entry', 'Mid', 'Senior', 'Director').optional(),
        skillsRequired: Joi.array().items(Joi.string()).optional(),
        salary: Joi.object()
            .keys({
                min: Joi.number().optional(),
                max: Joi.number().optional(),
                currency: Joi.string().optional(),
                payType: Joi.string().valid('Hourly', 'Monthly', 'Yearly').optional(),
            })
            .optional(),
        tags: Joi.array().items(Joi.string()).optional(),
        isFeatured: Joi.boolean().optional(),
        isActive: Joi.boolean().optional(),
        expiresAt: Joi.date().optional(),
    }),
};

const applyToJob = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
    body: Joi.object().keys({
        name: Joi.string().required(),
        email: Joi.string().required().email(),
        phone: Joi.string().optional(),
        resume: Joi.string().optional(),
        about: Joi.string().trim().optional(),
    }),
};

const updateApplicantStatus = {
    params: Joi.object().keys({
        jobId: Joi.string().required(),
        applicantId: Joi.string().required(),
    }),
    body: Joi.object().keys({
        status: Joi.string().valid('pending', 'approve', 'reject').required(),
    }),
};

const jobIdParam = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
};
module.exports = {
    createJob,
    updateJob,
    applyToJob,
    updateApplicantStatus,
    jobIdParam,
};
