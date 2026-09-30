const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

const {
    sendNotificationToAllUsers,
    sendNotificationToUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    fetchNotificationsForUser,
    fetchAllNotifications,
} = require('../services/notification.service');

// Send notification to all users
const sendToAll = catchAsync(async (req, res) => {
    const { title, body, metadata } = req.body;
    if (!title || !body) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Title and body are required');
    }

    await sendNotificationToAllUsers(title, body, metadata, true, {
        userId: req.user.id,
        companyId: null,
        groupId: null,
    });
    res.status(httpStatus.OK).send({ message: 'Notification sent to all users' });
});

// Send notification to a specific user
const sendToUser = catchAsync(async (req, res) => {
    const { fcmToken, title, body, userId, companyId = null, groupId = null, metadata, action = 'NONE' } = req.body;
    if (!fcmToken || !title || !body) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'FCM token, title, and body are required');
    }

    await sendNotificationToUser(fcmToken, title, body, { userId, companyId, groupId }, metadata, true, action);
    res.status(httpStatus.OK).send({ message: 'Notification sent to user' });
});

// Mark a notification as read
const markAsRead = catchAsync(async (req, res) => {
    const { notificationId } = req.params;
    if (!notificationId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Notification ID is required');
    }

    const notification = await markNotificationAsRead(notificationId);
    if (!notification) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
    }

    res.status(httpStatus.OK).send({ notification });
});

// Mark all notifications as read for a user
const markAllAsRead = catchAsync(async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
    }

    const result = await markAllNotificationsAsRead(userId);
    res.status(httpStatus.OK).send({ message: `Marked ${result.modifiedCount} notifications as read` });
});

// Fetch notifications for a user
const getNotifications = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { read } = req.query; // Optional filter for read/unread notifications

    if (!userId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
    }

    const notifications = await fetchNotificationsForUser(
        userId,
        read === 'true' ? true : read === 'false' ? false : null,
    );
    res.status(httpStatus.OK).send({ notifications });
});

// Fetch all admin notifications
const getAllAdminNotifications = catchAsync(async (req, res) => {
    const { read, action, startDate, endDate } = req.query;
    const filter = { user: req.user.id };
    if (read !== undefined) {
        filter.read = read === 'true';
    }
    if (action) {
        filter.action = action;
    }
    if (startDate) {
        filter.startDate = startDate;
    }
    if (endDate) {
        filter.endDate = endDate;
    }

    const notifications = await fetchAllNotifications(filter);
    res.status(httpStatus.OK).send({ notifications });
});

module.exports = {
    sendToAll,
    sendToUser,
    markAsRead,
    markAllAsRead,
    getNotifications,
    getAllAdminNotifications,
};
