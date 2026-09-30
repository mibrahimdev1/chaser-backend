const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createUser = {
    body: Joi.object().keys({
        email: Joi.string().required().email(),
        password: Joi.string().required().custom(password),
        name: Joi.string().required(),
        role: Joi.string().required().valid('user', 'admin'),
    }),
};

const getUsers = {
    query: Joi.object().keys({
        name: Joi.string(),
        role: Joi.string(),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
        status: Joi.string().valid('active', 'inactive', 'suspend').optional(),
        verificationStatus: Joi.string().valid('unverified', 'on_review', 'verified').optional(),
    }),
};

const getUser = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId),
    }),
};

const updateProfile = {
    body: Joi.object().keys({
        dob: Joi.date().optional(),
        profilePicture: Joi.string().optional(),
        firstName: Joi.string().optional(),
        lastName: Joi.string().optional(),
        coverImage: Joi.string().optional(),
        displayName: Joi.string().optional().trim(),
        username: Joi.string().optional().trim().lowercase(),
        userId: Joi.string().custom(objectId).optional(),
        gender: Joi.string().valid('male', 'female', 'other').optional(),
        bio: Joi.string().optional().trim(),
        address: Joi.string().optional().trim(),
        country: Joi.string().optional().trim(),
        state: Joi.string().optional().trim(),
        city: Joi.string().optional().trim(),
        zipcode: Joi.string()
            .optional()
            .trim()
            .regex(/^\d{4,10}$/), // Allows 4-10 digit postal codes
        chasingCategory: Joi.string().default('Chaser').optional().trim(),
        description: Joi.string().optional().trim(),
        // Verification documents (allow null or empty string to remove documents)
        driverLicense: Joi.string().uri().allow(null, '').optional(),
        passport: Joi.string().uri().allow(null, '').optional(),

        experiences: Joi.array()
            .items(
                Joi.object({
                    title: Joi.string().max(100).required().trim(),
                    company: Joi.string().max(100).required().trim(),
                    employmentType: Joi.string()
                        .valid('Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Other')
                        .optional(),
                    location: Joi.string().max(255).optional().trim(),
                    startDate: Joi.date().required(),
                    endDate: Joi.date().optional(),
                    description: Joi.string().max(2000).optional().trim(),
                }),
            )
            .optional(),

        education: Joi.array()
            .items(
                Joi.object({
                    institution: Joi.string().required().trim(),
                    degree: Joi.string().optional().trim(),
                    fieldOfStudy: Joi.string().optional().trim(),
                    startDate: Joi.date().optional(),
                    endDate: Joi.date().optional(),
                    description: Joi.string().optional().trim(),
                }),
            )
            .optional(),

        interests: Joi.array().items(Joi.string().trim()).optional(),

        skills: Joi.array()
            .items(Joi.string().max(80).trim())
            .max(100) // Allow up to 100 skills
            .optional(),

        awards: Joi.array()
            .items(
                Joi.object({
                    title: Joi.string().required().trim(),
                    issuer: Joi.string().optional().trim(),
                    dateReceived: Joi.date().optional(),
                    description: Joi.string().optional().trim(),
                }),
            )
            .optional(),
    }),
};

const updateUser = {
    params: Joi.object().keys({
        userId: Joi.required().custom(objectId),
    }),
    body: Joi.object()
        .keys({
            email: Joi.string().email(),
            password: Joi.string().custom(password),
            name: Joi.string(),
            firstName: Joi.string().optional(),
            lastName: Joi.string().optional(),
            role: Joi.string().valid('user', 'admin').optional(),
            status: Joi.string().valid('active', 'inactive', 'suspend'),
        })
        .min(1),
};

const deleteUser = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId),
    }),
};

const updateUserPasswordByAdmin = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId),
    }),
    body: Joi.object().keys({
        password: Joi.string().required().custom(password),
    }),
};

const togglePublicProfile = {
    body: Joi.object().keys({
        isPublicProfile: Joi.boolean().required(),
    }),
};

const updateUserStatusByAdmin = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        status: Joi.string().valid('active', 'inactive', 'suspend').required(),
    }),
};

const updateUserVerificationByAdmin = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId).required(),
    }),
    body: Joi.object().keys({
        verificationStatus: Joi.string().valid('unverified', 'on_review', 'verified').required(),
        rejectionReason: Joi.string().optional(),
    }),
};

module.exports = {
    createUser,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    updateProfile,
    updateUserPasswordByAdmin,
    togglePublicProfile,
    updateUserStatusByAdmin,
    updateUserVerificationByAdmin,
};
