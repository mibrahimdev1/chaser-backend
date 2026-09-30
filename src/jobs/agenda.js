const Agenda = require('agenda');
const config = require('../config/config');
const { Feed, LoginActivity, Job } = require('../models');
const { userIds } = require('../services/socket.service');
const { storyService, notificationService, feedService } = require('../services');
const admin = require('firebase-admin');
const Notifications = require('../models/notifications.model');
const { generateNotificationBody, actions } = require('../config/notificationActions');

const agenda = new Agenda({ db: { address: config.mongoose.url } });

// CONSTANTS
const TIME_THRESHOLD = 30 * 1000;
const socketUserIds = userIds.map((itm) => itm.split('split')[1]);

agenda.define('publish post', async (job) => {
    const { postId } = job.attrs.data;
    // Update post status to "published"
    await Feed.findByIdAndUpdate(postId, { status: 'published' });

    try {
        const post = await feedService.findFeed(postId);
        if (post && post.length > 0) {
            const user = post[0]?.userId;
            if (user && user.fcmToken) {
                await notificationService.sendNotificationToUser(
                    user.fcmToken,
                    `Your Post ${post.caption ? post.caption : ''} is Live!`,
                    generateNotificationBody(actions.POST_ADD, { post: post.caption ? post.caption : '' }),
                    { userId: user._id, companyId: null, groupId: null },
                    { userId: user._id, feedId: postId, icon: user.profilePicture },
                    true,
                    actions.POST_ADD,
                );
            }
        }
    } catch (error) {
        // bypass no-empty lint
    }
});

agenda.define('check-user-login-status', async () => {
    try {
        const currentTime = Date.now();

        await Promise.all(
            socketUserIds.map(async (userId) => {
                const loginActivity = await LoginActivity.findOne({ userId }).sort({ timestamp: -1 }).limit(1);

                if (!loginActivity) return;

                const timeSinceLastLogin = currentTime - new Date(loginActivity.timestamp).getTime();

                if (timeSinceLastLogin > TIME_THRESHOLD) {
                    await LoginActivity.deleteOne({ userId });
                } else {
                    const existingLogin = await LoginActivity.findOne({ userId });
                    if (!existingLogin) {
                        const newLoginActivity = new LoginActivity({ userId });
                        await newLoginActivity.save();
                    }
                }
            }),
        );
    } catch (error) {
        throw new Error(error);
        // console.error('Error while checking user login status:', error);
    }
});

agenda.define('expire stories', async () => {
    await storyService.expireStories();
});

agenda.define('expire job', async (job) => {
    const { jobId } = job.attrs.data;
    await Job.findByIdAndUpdate(jobId, { isActive: false });
});

agenda.define('send-notification-batch', async (job) => {
    const { users, title, body, metadata, action, company = null, group = null } = job.attrs.data;

    // try {
    // Extract FCM tokens from the batch
    const fcmTokens = users.map((user) => user.fcmToken);

    // Send notifications to the batch of FCM tokens
    const message = {
        notification: { title, body },
        data: { action, ...metadata },
        tokens: fcmTokens,
    };

    await admin.messaging().sendEachForMulticast(message);
    // console.log('Notifications sent successfully:', response);

    // Save notifications to the database in bulk
    const notificationRecords = users.map((user) => ({
        user: user.userId,
        company,
        group,
        title,
        body,
        action,
        metadata,
        read: false,
    }));

    await Notifications.insertMany(notificationRecords);
    // } catch (error) {
    //   // console.log(error);
    //   throw error; // Let Agenda retry the job
    // }
});

// Initialize agenda after MongoDB connection is established
const initializeAgenda = async () => {
    try {
        await agenda.start();
        // await agenda.every('1 minute', 'check-user-login-status'); // for socket
        await agenda.every('1 hour', 'expire stories'); // Runs every hour
    } catch (error) {
        console.error('Error initializing agenda:', error);
        throw error;
    }
};

module.exports = { agenda, initializeAgenda };
