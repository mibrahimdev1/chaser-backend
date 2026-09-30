const { Story, UserConnection } = require('../models');

const createStory = async (data) => {
    return await Story.create(data);
};

const getUserStories = async (userId) => {
    return await Story.find({ userId, isExpired: false }).sort({ createdAt: -1 });
};

const getExpiredStories = async (userId) => {
    return await Story.find({ userId, isExpired: true });
};

const deleteStory = async (storyId) => {
    return await Story.findByIdAndDelete(storyId);
};

const expireStories = async () => {
    const expiryTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return await Story.updateMany({ createdAt: { $lt: expiryTime } }, { isExpired: true });
};

const getStory = async (storyId) => {
    return await Story.findById(storyId);
};

// const getFollowedUsersStories = async (currentUserId) => {
//   try {
//     // Get all users that the current user is following (accepted connections)
//     const followedConnections = await UserConnection.find({
//       sender: currentUserId,
//       status: 'accepted'
//     }).select('receiver');

//     // Also get users who are following the current user (mutual connections)
//     const followerConnections = await UserConnection.find({
//       receiver: currentUserId,
//       status: 'accepted'
//     }).select('sender');

//     // Extract user IDs from both arrays
//     const followedUserIds = followedConnections.map(conn => conn.receiver);
//     const followerUserIds = followerConnections.map(conn => conn.sender);

//     // Combine both arrays and remove duplicates
//     const allConnectedUserIds = [...new Set([...followedUserIds, ...followerUserIds])];

//     if (allConnectedUserIds.length === 0) {
//       return [];
//     }

//     // Get stories from followed users that are not expired
//     const stories = await Story.find({
//       userId: { $in: allConnectedUserIds },
//       isExpired: false
//     })
//     .populate('userId', 'firstName lastName profilePicture')
//     .sort({ createdAt: -1 });

//     return stories;
//   } catch (error) {
//     throw new Error(`Error fetching followed users stories: ${error.message}`);
//   }
// };

const getFollowedUsersStories = async (currentUserId) => {
    try {
        // Get all users that the current user is following (accepted connections)
        // sender = currentUserId means current user is following the receiver
        const followedConnections = await UserConnection.find({
            sender: currentUserId,
            status: 'accepted',
        }).select('receiver');

        // Extract user IDs that the current user is following
        const followedUserIds = followedConnections.map((conn) => conn.receiver);

        // Include current user's own ID to show their own stories
        const allUserIds = [currentUserId, ...followedUserIds];

        // Get stories from followed users (including current user) that are not expired
        const stories = await Story.find({
            userId: { $in: allUserIds },
            isExpired: false,
        })
            .populate('userId', 'firstName lastName profilePicture')
            .sort({ createdAt: -1 });

        return stories;
    } catch (error) {
        throw new Error(`Error fetching followed users stories: ${error.message}`);
    }
};
module.exports = {
    createStory,
    getUserStories,
    getExpiredStories,
    deleteStory,
    expireStories,
    getStory,
    getFollowedUsersStories,
};
