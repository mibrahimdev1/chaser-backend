const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, userconnectionService, feedService, chatService, stripeService } = require('../services');
const { LoginActivity } = require('../models');

const createUser = catchAsync(async (req, res) => {
    const user = await userService.createUser(req.body);
    res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name', 'role', 'status', 'verificationStatus']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await userService.queryUsers(filter, options);
    res.send(result);
});

const getMe = catchAsync(async (req, res) => {
    const meta = {};
    const user = await userService.getUserById(req.user.id);
    const userProfile = await userService.getUserProfileByUserId(req.user.id);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    const [postCount, followerCount, followingCount] = await Promise.all([
        feedService.count({ userId: req.user.id }),
        userconnectionService.count({ receiver: req.user.id, status: 'accepted' }),
        userconnectionService.count({ sender: req.user.id, status: 'accepted' }),
    ]);
    if (req.user.role === 'admin') {
        meta.lastActive = (
            await LoginActivity.findOne({ userId: req.user.id }, { createdAt: 1 }).sort({ createdAt: -1 })
        )?.createdAt;
        meta.subscriptions = await stripeService.listUserSubscriptions(user.stripe_customer_id, true)?.data;
    }
    meta.followerCount = followerCount;
    meta.followingCount = followingCount;
    meta.postCount = postCount;
    res.send({ user, userProfile, meta });
});

const getUser = catchAsync(async (req, res) => {
    const meta = {};
    const user = await userService.getUserById(req.params.userId);
    const userProfile = await userService.getUserProfileByUserId(req.params.userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    const [postCount, followerCount, followingCount] = await Promise.all([
        feedService.count({ userId: req.params.userId }),
        userconnectionService.count({ receiver: req.params.userId, status: 'accepted' }),
        userconnectionService.count({ sender: req.params.userId, status: 'accepted' }),
    ]);
    if (req.user.role === 'admin') {
        meta.lastActive = (
            await LoginActivity.findOne({ userId: req.params.userId }, { createdAt: 1 }).sort({ createdAt: -1 })
        )?.createdAt;
        meta.subscriptions = await stripeService.listUserSubscriptions(user.stripe_customer_id, true)?.data;
    }
    meta.friendshipStatus = await userconnectionService.checkFriendshipStatus(req.user.id, req.params.userId);
    meta.followerCount = followerCount;
    meta.followingCount = followingCount;
    meta.postCount = postCount;
    meta.requestId = await userconnectionService.getRequest(req.user.id, req.params.userId);
    const chat = await chatService.getChat({ members: { $in: [req.user.id, req.params.userId] } });
    if (chat) {
        meta.chatId = chat.id;
    } else {
        meta.chatId = null;
    }
    res.send({ user, userProfile, meta });
});

const updateUser = catchAsync(async (req, res) => {
    const user = await userService.updateUserById(req.params.userId, req.body);
    res.send(user);
});

const updateUserProfile = catchAsync(async (req, res) => {
    const { user, userProfile } = await userService.updateUserProfile(req.user.id, req.body);
    res.send({
        user,
        userProfile,
        message:
            user.verificationStatus === 'unverified'
                ? 'Profile updated. Please upload verification documents.'
                : user.verificationStatus === 'on_review'
                ? 'Profile updated. Your documents are under review.'
                : 'Profile updated successfully.',
    });
});

const deleteUser = catchAsync(async (req, res) => {
    await userService.deleteUserById(req.params.userId);
    res.status(httpStatus.NO_CONTENT).send();
});

const getSuggestedUsers = catchAsync(async (req, res) => {
    const { page = 1, limit = 10, factor = null } = req.query;
    const result = await userService.getSuggestedUsers(req.user._id, parseInt(page, 10), parseInt(limit, 10), factor);
    return res.status(httpStatus.OK).send(result);
});

const addNewFieldToAllDocuments = async (req, res) => {
    await userService.sync(req.body);
    res.send();
};

const exportUsers = catchAsync(async (req, res) => {
    const excelBuffer = await userService.exportUsersToExcel();

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=users_export.xlsx');
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the Excel file
    res.send(excelBuffer);
});

const updateUserPasswordByAdmin = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { password } = req.body;

    const user = await userService.updateUserPasswordByAdmin(userId, password);

    res.status(httpStatus.OK).send({
        message: 'Password updated successfully',
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        },
    });
});

const togglePublicProfile = catchAsync(async (req, res) => {
    const { isPublicProfile } = req.body;
    const userId = req.user.id;

    const user = await userService.updateUserById(userId, { isPublicProfile });

    res.status(httpStatus.OK).send({
        message: `Profile is now ${isPublicProfile ? 'public' : 'private'}`,
        user: {
            id: user.id,
            isPublicProfile: user.isPublicProfile,
        },
    });
});

const updateUserStatusByAdmin = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;

    const user = await userService.updateUserStatusByAdmin(userId, status);

    res.status(httpStatus.OK).send({
        message: `User account status updated to ${status}`,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            status: user.status,
        },
    });
});

const updateUserVerificationByAdmin = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { verificationStatus, rejectionReason } = req.body;

    const user = await userService.updateUserVerificationByAdmin(userId, verificationStatus, rejectionReason);

    res.status(httpStatus.OK).send({
        message: `User verification status updated to ${verificationStatus}`,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isEmailVerified: user.isEmailVerified,
            verificationStatus: user.verificationStatus,
            rejectionReason: user.rejectionReason,
        },
    });
});

module.exports = {
    createUser,
    getUsers,
    getMe,
    getUser,
    updateUser,
    deleteUser,
    updateUserProfile,
    getSuggestedUsers,
    addNewFieldToAllDocuments,
    exportUsers,
    updateUserPasswordByAdmin,
    togglePublicProfile,
    updateUserStatusByAdmin,
    updateUserVerificationByAdmin,
};
