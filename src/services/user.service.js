const httpStatus = require('http-status');
const { User, UserProfile, UserConnection } = require('../models');
const ApiError = require('../utils/ApiError');
const { addCustomer } = require('./stripe.service');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const { sendNotificationToUser } = require('./notification.service');
/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
    console.log('USER BODY: ', userBody);
    if (await User.isEmailTaken(userBody.email)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }

    // Check if username is taken (if provided and not empty)
    const { username, ...userData } = userBody;
    const trimmedUsername = username?.toLowerCase().trim();

    if (trimmedUsername) {
        const existingProfile = await UserProfile.findOne({ username: trimmedUsername });
        if (existingProfile) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
        }
    }

    // Clean up empty strings - convert to undefined so they're not stored
    if (userData.firstName === '') userData.firstName = undefined;
    if (userData.lastName === '') userData.lastName = undefined;

    const { id: stripe_customer_id } = await addCustomer(
        `${userData.firstName || ''}${userData.lastName || ''}`,
        userBody.email,
    );
    const user = await User.create({ ...userData, stripe_customer_id });

    // Create UserProfile if username is provided and not empty
    if (trimmedUsername) {
        await UserProfile.create({
            userId: user._id,
            username: trimmedUsername,
        });
    }

    console.log('CREATED USER: ', user);

    return user;
};

const getUserProfileByUserId = async (userId) => {
    return await UserProfile.findOne({ userId });
};

const saveOrUpdateFcmToken = async (userId, fcm) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    // Update the FCM token
    user.fcmToken = fcm;
    await user.save();
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
    // ALWAYS use priority sorting for admins (on_review users at top)
    // Store any custom sortBy for secondary sorting
    const customSecondarySort = options.sortBy;
    options.customSort = true;
    options.secondarySort = customSecondarySort;

    // If name filter is provided, create a more comprehensive search
    if (filter.name) {
        const nameSearchTerm = filter.name;
        const nameFilter = {
            $or: [
                { firstName: { $regex: nameSearchTerm, $options: 'i' } },
                { lastName: { $regex: nameSearchTerm, $options: 'i' } },
                { displayName: { $regex: nameSearchTerm, $options: 'i' } },
                { email: { $regex: nameSearchTerm, $options: 'i' } },
            ],
        };

        // Remove name from filter and add the comprehensive search
        const { name, ...otherFilters } = filter;
        const finalFilter = { ...otherFilters, ...nameFilter };

        // Use custom aggregation for priority sorting
        return await paginateWithVerificationPriority(finalFilter, options);
    }

    // Use custom aggregation for priority sorting
    return await paginateWithVerificationPriority(filter, options);
};

/**
 * Paginate users with verification status priority (on_review first)
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const paginateWithVerificationPriority = async (filter, options) => {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const pipeline = [
        { $match: filter },
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                metadata: [{ $count: 'totalResults' }],
                results: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: 'userprofiles',
                            localField: '_id',
                            foreignField: 'userId',
                            as: 'userProfile',
                        },
                    },
                    { $unwind: { path: '$userProfile', preserveNullAndEmptyArrays: true } },
                    {
                        $addFields: {
                            username: '$userProfile.username',
                            id: { $toString: '$_id' },
                        },
                    },
                    { $project: { userProfile: 0 } },
                ],
            },
        },
    ];

    const [aggregationResult] = await User.aggregate(pipeline);

    const totalResults = aggregationResult.metadata[0]?.totalResults || 0;
    const results = aggregationResult.results || [];

    return {
        results,
        page,
        limit,
        totalPages: Math.ceil(totalResults / limit),
        totalResults,
    };
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
    const user = await User.findById(id).populate('userProfile', 'username');
    if (user && user.userProfile) {
        user.username = user.userProfile.username;
        user.userProfile = undefined;
    }
    return user;
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
    return User.findOne({ email });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
    const user = await getUserById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }
    Object.assign(user, updateBody);
    await user.save();
    return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
    const user = await getUserById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    await user.remove();
    return user;
};

/**
 * Updates the user profile with the given data.
 *
 * @param {string} userId - The ID of the user whose profile is to be updated.
 * @param {Object} body - The data to update the user profile with.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the updated user and user profile.
 */
const updateUserProfile = async (userId, body) => {
    const { dob, firstName, lastName, profilePicture, displayName, driverLicense, passport, ...profileData } = body;

    // Get current user to check verification status
    const currentUser = await User.findById(userId);
    if (!currentUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Check if documents are being provided or removed
    const hasDocuments = driverLicense || passport;
    const isRemovingDocuments = driverLicense === null || passport === null || driverLicense === '' || passport === '';

    if (
        dob ||
        profilePicture ||
        displayName ||
        firstName ||
        lastName ||
        driverLicense !== undefined ||
        passport !== undefined
    ) {
        const updateData = {
            ...(dob && { dob }),
            ...(profilePicture && { profilePicture }),
            ...(displayName && { displayName }),
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            isProfileCompleted: true,
        };

        // Handle document updates
        if (driverLicense !== undefined) {
            updateData.driverLicense = driverLicense || null;
        }
        if (passport !== undefined) {
            updateData.passport = passport || null;
        }

        // Determine verification status based on documents
        // Get final document state after update
        const finalDriverLicense = driverLicense !== undefined ? driverLicense || null : currentUser.driverLicense;
        const finalPassport = passport !== undefined ? passport || null : currentUser.passport;

        // If both documents are null, set to 'unverified'
        if (!finalDriverLicense && !finalPassport) {
            updateData.verificationStatus = 'unverified';
            updateData.isEmailVerified = false;
            // Clear rejection reason when documents are removed
            updateData.rejectionReason = null;
        }
        // If uploading new documents, set to 'on_review'
        else if (hasDocuments && currentUser.verificationStatus !== 'verified') {
            updateData.verificationStatus = 'on_review';
            updateData.isEmailVerified = false;
        }
        // If user was verified and documents are being removed, set to 'unverified'
        else if (currentUser.verificationStatus === 'verified' && isRemovingDocuments) {
            updateData.verificationStatus = 'unverified';
            updateData.isEmailVerified = false;
            updateData.rejectionReason = null;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true },
        );

        const updatedProfile = await UserProfile.findOneAndUpdate(
            { userId },
            { $set: profileData },
            { new: true, upsert: true, runValidators: true },
        );

        return { user: updatedUser, userProfile: updatedProfile };
    } else {
        // Even if no user fields are updated, set isProfileCompleted to true
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    isProfileCompleted: true,
                },
            },
            { new: true, runValidators: true },
        );

        const updatedProfile = await UserProfile.findOneAndUpdate(
            { userId },
            { $set: profileData },
            { new: true, upsert: true, runValidators: true },
        );

        return { user: updatedUser, userProfile: updatedProfile };
    }
};

const getSuggestedUsers = async (userId, page, limit, factor) => {
    const skip = (page - 1) * limit;

    const userProfile = await UserProfile.findOne({ userId }).populate('userId');

    if (!userProfile) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User profile not found');
    }

    const { country, state, city, interests, education, chasingCategory, skills, experiences } = userProfile;
    const connections = await UserConnection.find({
        $or: [{ sender: userId }, { receiver: userId }],
    }).lean(); // Use lean() for performance

    // Use a Set to store unique user IDs
    const connectedUserIds = new Set();

    connections.forEach(({ sender, receiver }) => {
        if (sender.toString() !== userId.toString()) connectedUserIds.add(sender.toString());
        if (receiver.toString() !== userId.toString()) connectedUserIds.add(receiver.toString());
    });
    const uniqueUserIds = Array.from(connectedUserIds);
    // console.log(uniqueUserIds);
    // Ensure `excludeUsers` includes `userId`
    const excludeUsers = new Set([...uniqueUserIds, userId]);
    // console.log(excludeUsers);
    const factorQueries = {
        peopleInYourIndustry: {
            query: {
                userId: { $nin: [...excludeUsers] }, // Explicitly exclude userId
                $or: [
                    { 'experiences.company': { $in: experiences.map((e) => e.company) } },
                    { chasingCategory },
                    { 'skills.name': { $in: skills.map((s) => s.name) } },
                ],
            },
        },
        peopleFromYourLocation: {
            query: {
                userId: { $nin: [...excludeUsers] }, // Ensure userId is excluded
                country,
                state,
                city,
            },
        },
        peopleWithSimilarInterests: {
            query: {
                userId: { $nin: [...excludeUsers] }, // Ensure userId is excluded
                interests: { $in: interests },
            },
        },
        peopleWithSimilarEducation: {
            query: {
                userId: { $nin: [...excludeUsers] }, // Ensure userId is excluded
                'education.institution': { $in: education.map((e) => e.institution) },
            },
        },
        newUsers: {
            query: {
                userId: { $nin: [...excludeUsers] }, // Ensure userId is excluded
            },
            sort: { createdAt: -1 },
        },
    };

    if (factor) {
        if (!factorQueries[factor]) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid factor provided');
        }
        const { query, sort = {} } = factorQueries[factor];
        const data = await UserProfile.find(query).sort(sort).skip(skip).limit(limit).lean();
        return { [factor]: data };
    }

    const results = {};
    await Promise.all(
        Object.entries(factorQueries).map(async ([key, { query, sort = {} }]) => {
            results[key] = await UserProfile.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('userId', 'email firstName lastName profilePicture displayName')
                .populate('userId.userProfile', 'username')
                .lean();

            Object.keys(results).forEach((key) => {
                results[key].forEach((profile) => {
                    if (profile.userId && profile.userId.userProfile) {
                        profile.userId.username = profile.userId.userProfile.username;
                        delete profile.userId.userProfile;
                    }
                });
            });
        }),
    );

    return results;
};

const sync = async ({ model, newFields }) => {
    await mongoose.model(model).updateMany(
        {}, // This matches all documents
        { $set: newFields }, // Set the new field with a default value
        { upsert: false, multi: true }, // Ensure multiple documents are updated
    );
};

/**
 * Update user password by admin
 * @param {ObjectId} userId - User ID to update password for
 * @param {string} newPassword - New password
 * @returns {Promise<User>}
 */
const updateUserPasswordByAdmin = async (userId, newPassword) => {
    const user = await getUserById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Check if user has local provider (password-based authentication)
    if (user.provider !== 'local') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update password for users with social login (Google/Apple)');
    }

    // Update password directly
    user.password = newPassword;
    await user.save();

    return user;
};

/**
 * Update user account status by admin (active, inactive, suspend)
 * @param {ObjectId} userId - User ID
 * @param {string} status - New status (active, inactive, suspend)
 * @returns {Promise<User>}
 */
const updateUserStatusByAdmin = async (userId, status) => {
    const user = await getUserById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Validate status
    const validStatuses = ['active', 'inactive', 'suspend'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid status. Must be: active, inactive, or suspend');
    }

    // Update user status
    user.status = status;
    await user.save();
    return user;
};

/**
 * Update user email verification status by admin
 * @param {ObjectId} userId - User ID
 * @param {string} verificationStatus - New verification status (unverified, on_review, verified)
 * @param {string} rejectionReason - Reason for rejection (optional)
 * @returns {Promise<User>}
 */
const updateUserVerificationByAdmin = async (userId, verificationStatus, rejectionReason = null) => {
    const user = await getUserById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Validate verification status
    const validStatuses = ['unverified', 'on_review', 'verified'];
    if (!validStatuses.includes(verificationStatus)) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Invalid verification status. Must be: unverified, on_review, or verified',
        );
    }

    // Store the previous status to check if this is a rejection
    const previousStatus = user.verificationStatus;
    const isRejection = verificationStatus === 'unverified' && previousStatus !== 'unverified' && rejectionReason;

    // Update user verification status
    user.verificationStatus = verificationStatus;

    // Set isEmailVerified to true only when status is 'verified'
    user.isEmailVerified = verificationStatus === 'verified';

    if (rejectionReason) {
        user.rejectionReason = rejectionReason;
    } else {
        // Clear rejection reason if not provided
        user.rejectionReason = undefined;
    }

    await user.save();

    // Send notification if this is a rejection
    if (isRejection && user.fcmToken) {
        try {
            await sendNotificationToUser(
                user.fcmToken,
                'Verification Rejected',
                `Your verification has been rejected. Reason: ${rejectionReason}`,
                { userId: user._id.toString(), companyId: null, groupId: null },
                { rejectionReason, verificationStatus },
                true,
                'VERIFICATION_REJECTED',
            );
        } catch (error) {
            // Log error but don't fail the update
            console.error('Failed to send rejection notification:', error);
        }
    }

    return user;
};

/**
 * Export all users to Excel format
 * @returns {Promise<Buffer>} Excel file buffer
 */
const exportUsersToExcel = async () => {
    // Get all users with their profiles
    const users = await User.find({}).populate('userProfile').lean();

    // Prepare data for Excel
    const excelData = users.map((user) => {
        const userProfile = user.userProfile || {};

        return {
            'User ID': user._id.toString(),
            'First Name': user.firstName || '',
            'Last Name': user.lastName || '',
            'Display Name': user.displayName || '',
            Email: user.email || '',
            Role: user.role || '',
            Status: user.status || '',
            Provider: user.provider || '',
            'Is Email Verified': user.isEmailVerified ? 'Yes' : 'No',
            'Verification Status': user.verificationStatus || 'unverified',
            'Is Profile Completed': user.isProfileCompleted ? 'Yes' : 'No',
            'Date of Birth': user.dob ? new Date(user.dob).toLocaleDateString() : '',
            'Profile Picture': user.profilePicture || '',
            'Stripe Customer ID': user.stripe_customer_id || '',
            'Google ID': user.googleId || '',
            'Apple ID': user.appleId || '',
            'Driver License': user.driverLicense || '',
            Passport: user.passport || '',
            'Rejection Reason': user.rejectionReason || '',
            'Created At': user.createdAt ? new Date(user.createdAt).toLocaleString() : '',
            'Updated At': user.updatedAt ? new Date(user.updatedAt).toLocaleString() : '',
            // User Profile fields
            Username: userProfile.username || '',
            Bio: userProfile.bio || '',
            Gender: userProfile.gender || '',
            Address: userProfile.address || '',
            Country: userProfile.country || '',
            State: userProfile.state || '',
            City: userProfile.city || '',
            Zipcode: userProfile.zipcode || '',
            'Chasing Category': userProfile.chasingCategory || '',
            Description: userProfile.description || '',
            Interests: userProfile.interests ? userProfile.interests.join(', ') : '',
            Skills: userProfile.skills ? userProfile.skills.map((skill) => skill.name).join(', ') : '',
            Education: userProfile.education
                ? userProfile.education.map((edu) => `${edu.institution} - ${edu.degree}`).join('; ')
                : '',
            Experience: userProfile.experiences
                ? userProfile.experiences.map((exp) => `${exp.company} - ${exp.position}`).join('; ')
                : '',
            Awards: userProfile.awards ? userProfile.awards.map((award) => award.title).join(', ') : '',
        };
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const columnWidths = [
        { wch: 25 }, // User ID
        { wch: 15 }, // First Name
        { wch: 15 }, // Last Name
        { wch: 20 }, // Display Name
        { wch: 30 }, // Email
        { wch: 10 }, // Role
        { wch: 10 }, // Status
        { wch: 10 }, // Provider
        { wch: 15 }, // Is Email Verified
        { wch: 20 }, // Is Profile Completed
        { wch: 15 }, // Date of Birth
        { wch: 50 }, // Profile Picture
        { wch: 30 }, // Stripe Customer ID
        { wch: 25 }, // Google ID
        { wch: 25 }, // Apple ID
        { wch: 50 }, // Driver License
        { wch: 50 }, // Passport
        { wch: 50 }, // Rejection Reason
        { wch: 20 }, // Created At
        { wch: 20 }, // Updated At
        { wch: 20 }, // Username
        { wch: 50 }, // Bio
        { wch: 10 }, // Gender
        { wch: 30 }, // Address
        { wch: 15 }, // Country
        { wch: 15 }, // State
        { wch: 15 }, // City
        { wch: 10 }, // Zipcode
        { wch: 20 }, // Chasing Category
        { wch: 50 }, // Description
        { wch: 50 }, // Interests
        { wch: 50 }, // Skills
        { wch: 50 }, // Education
        { wch: 50 }, // Experience
        { wch: 50 }, // Awards
    ];

    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return excelBuffer;
};

module.exports = {
    createUser,
    queryUsers,
    getUserById,
    getUserByEmail,
    updateUserById,
    deleteUserById,
    updateUserProfile,
    saveOrUpdateFcmToken,
    getUserProfileByUserId,
    getSuggestedUsers,
    sync,
    exportUsersToExcel,
    updateUserPasswordByAdmin,
    updateUserStatusByAdmin,
    updateUserVerificationByAdmin,
};
