const admin = require('firebase-admin');
const { Notification } = require('../models');
const { agenda } = require('../jobs/agenda');

// Function to send notification to all users
const sendNotificationToAllUsers = async (
    title,
    body,
    metadata = null,
    saveToDB = false,
    ids = { companyId: null, userId: null, groupId: null },
    action = 'NONE',
) => {
    const message = {
        notification: {
            title,
            body,
        },
        data: metadata ? { ...metadata, action } : { action },
        topic: 'all',
    };

    try {
        await admin.messaging().send(message);
        // console.log('Notification sent successfully:', response);

        if (saveToDB) {
            const notification = new Notification({
                title,
                body,
                metadata,
                user: ids.userId,
                company: ids.companyId,
                group: ids.groupId,
                action,
            });
            await notification.save();
        }
    } catch (error) {
        // console.error('Error sending notification:', error);
    }
};

const sendNotificationToUser = async (
    fcmToken,
    title,
    body,
    ids = { companyId: null, userId: null, groupId: null },
    metadata = null,
    saveToDB = false,
    action = 'NONE',
) => {
    console.log(`[sendNotificationToUser] ========== FUNCTION CALLED ==========`);
    console.log(`[sendNotificationToUser] fcmToken: ${fcmToken ? 'EXISTS' : 'MISSING'}`);
    console.log(`[sendNotificationToUser] userId: ${ids.userId}`);
    console.log(`[sendNotificationToUser] saveToDB: ${saveToDB}`);
    console.log(`[sendNotificationToUser] title: ${title}`);

    if (!ids.userId) {
        console.log('[sendNotificationToUser] ERROR: No userId - RETURNING');
        return null;
    }

    let savedNotification = null;

    if (saveToDB) {
        console.log('[sendNotificationToUser] STEP A: Saving to database...');
        try {
            savedNotification = await Notification.create({
                title,
                action,
                body,
                user: ids.userId,
                company: ids.companyId || null,
                group: ids.groupId || null,
                metadata: metadata || null,
            });
            console.log(`[sendNotificationToUser] STEP A SUCCESS: Saved to DB with ID: ${savedNotification._id}`);
        } catch (dbError) {
            console.error('[sendNotificationToUser] STEP A ERROR:', dbError.message);
            console.error('[sendNotificationToUser] STEP A ERROR FULL:', dbError);
            return { error: 'DB_SAVE_FAILED', details: dbError.message };
        }
    }

    if (!fcmToken) {
        console.log('[sendNotificationToUser] No FCM token - returning with saved notification only');
        return { savedNotification };
    }

    const dataPayload = metadata ? { ...metadata } : {};
    if (action && action !== 'NONE') {
        dataPayload.action = action;
    }

    const message = {
        notification: { title, body },
        data: Object.keys(dataPayload).reduce((acc, key) => {
            acc[key] = String(dataPayload[key]);
            return acc;
        }, {}),
        token: fcmToken,
    };

    try {
        console.log('[sendNotificationToUser] STEP B: Sending Firebase push...');
        const firebaseResponse = await admin.messaging().send(message);
        console.log('[sendNotificationToUser] STEP B SUCCESS: Firebase sent');
        return { savedNotification, firebaseResponse };
    } catch (firebaseError) {
        console.error('[sendNotificationToUser] STEP B ERROR:', firebaseError.message);
        return { savedNotification, firebaseError: firebaseError.message };
    }
};

// Function to mark a single notification as read by its ID
const markNotificationAsRead = async (notificationId) => {
    // try {
    const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { read: true },
        { new: true }, // Return the updated document
    );

    if (!notification) {
        // console.log('Notification not found');
        return null;
    }

    // console.log('Notification marked as read:', notification);
    return notification;
    // }
    // catch (error) {
    //   // console.error('Error marking notification as read:', error);
    //   throw error;
    // }
};

// Function to mark all notifications as read for a specific user
const markAllNotificationsAsRead = async (userId) => {
    // try {
    const result = await Notification.updateMany(
        { user: userId, read: false }, // Filter for unread notifications of the user
        { read: true }, // Update all matching notifications
    );

    // console.log(`Marked ${result.modifiedCount} notifications as read for user ${userId}`);
    return result;
    // } catch (error) {
    // console.error('Error marking all notifications as read:', error);
    //   throw error;
    // }
};

// Function to fetch notifications for a user (with optional read/unread filter)
const fetchNotificationsForUser = async (userId, readStatus = null) => {
    // try {
    const query = { user: userId };

    if (readStatus !== null) {
        query.read = readStatus; // Filter by read status if provided
    }

    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 }) // Sort by latest first
        .populate({
            path: 'user',
            select: 'firstName lastName displayName profilePicture email',
        })
        .populate({
            path: 'user.userProfile',
            select: 'username',
        })
        .lean();

    notifications.forEach((notification) => {
        if (notification.user && notification.user.userProfile) {
            notification.user.username = notification.user.userProfile.username;
            delete notification.user.userProfile;
        }
    });

    return notifications;
    // } catch (error) {
    // console.error('Error fetching notifications:', error);
    // throw error;
    // }
};

async function scheduleNotifications(
    users,
    title,
    body,
    metadata,
    action,
    company = null,
    group = null,
    batchSize = 500,
) {
    try {
        // Split users into batches
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);

            // Schedule a job for each batch
            await agenda.schedule('now', 'send-notification-batch', {
                users: batch,
                title,
                body,
                metadata,
                action,
                company,
                group,
            });
        }
    } catch (error) {
        // console.error('Error scheduling notifications:', error);
    }
}

/**
 * Fetch all notifications (Admin only)
 * @param {Object} filter - Filter options (read status, date range, etc.)
 * @returns {Promise<Array>}
 */
const fetchAllNotifications = async (filter = {}) => {
    const query = {};
    if (filter.user) {
        query.user = filter.user;
    }
    // Filter by read status if provided
    if (filter.read !== undefined) {
        query.read = filter.read;
    }

    // Filter by date range if provided
    if (filter.startDate || filter.endDate) {
        query.createdAt = {};
        if (filter.startDate) {
            query.createdAt.$gte = new Date(filter.startDate);
        }
        if (filter.endDate) {
            query.createdAt.$lte = new Date(filter.endDate);
        }
    }

    // Filter by action if provided
    if (filter.action) {
        query.action = filter.action;
    }

    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 }) // Sort by latest first
        .populate({
            path: 'user',
            select: 'firstName lastName displayName profilePicture email',
        })
        .populate({
            path: 'user.userProfile',
            select: 'username',
        })
        .populate({
            path: 'company',
            select: 'name logo',
        })
        .populate({
            path: 'group',
            select: 'name description',
        })
        .lean();

    notifications.forEach((notification) => {
        if (notification.user && notification.user.userProfile) {
            notification.user.username = notification.user.userProfile.username;
            delete notification.user.userProfile;
        }
    });

    return notifications;
};

module.exports = {
    sendNotificationToAllUsers,
    sendNotificationToUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    fetchNotificationsForUser,
    scheduleNotifications,
    fetchAllNotifications,
};
