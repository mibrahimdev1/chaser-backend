const httpStatus = require('http-status');
const UserConnection = require('../models/userconnection.model');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');

const sendFriendRequest = async (senderId, receiverId) => {
    if (senderId === receiverId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'You cannot send a request to yourself.');
    }
    const existingRequest = await UserConnection.findOne({ sender: senderId, receiver: receiverId });
    if (existingRequest) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Friend request already sent.');
    }

    // Check if receiver has public profile
    const receiver = await User.findById(receiverId).select('isPublicProfile');

    // If receiver has public profile, auto-accept the request
    const status = receiver && receiver.isPublicProfile ? 'accepted' : 'pending';

    return await UserConnection.create({ sender: senderId, receiver: receiverId, status });
};

const find = async (filter) => {
    return await UserConnection.findOne(filter);
};
const acceptFriendRequest = async (requestId, userId) => {
    const friendRequest = await UserConnection.findById(requestId);
    if (!friendRequest || friendRequest.receiver.toString() !== userId) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Friend request not found.');
    }

    friendRequest.status = 'accepted';
    await friendRequest.save();
    return friendRequest;
};

const unfriend = async (requestId) => {
    return await UserConnection.findOneAndDelete({ _id: requestId });
};
const rejectFriendRequest = async (requestId, userId) => {
    const friendRequest = await UserConnection.findById(requestId);

    if (!friendRequest) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Friend request not found.');
    }
    if (friendRequest.receiver.toString() !== userId && friendRequest.sender.toString() !== userId) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Friend request not found.');
    }
    // friendRequest.status = 'rejected';
    // await friendRequest.save();
    // return friendRequest;
    unfriend(requestId);
};

const getFriends = async (userId) => {
    const connections = await UserConnection.find({
        $or: [{ sender: userId }, { receiver: userId }],
        status: 'accepted',
    })
        .populate({
            path: 'sender',
            select: 'firstName lastName displayName profilePicture fcmToken',
            populate: {
                path: 'userProfile',
                select: 'username',
            },
        })
        .populate({
            path: 'receiver',
            select: 'firstName lastName displayName profilePicture fcmToken',
            populate: {
                path: 'userProfile',
                select: 'username',
            },
        })
        .lean();

    connections.forEach((conn) => {
        if (conn.sender && conn.sender.userProfile) {
            conn.sender.username = conn.sender.userProfile.username;
            delete conn.sender.userProfile;
        }
        if (conn.receiver && conn.receiver.userProfile) {
            conn.receiver.username = conn.receiver.userProfile.username;
            delete conn.receiver.userProfile;
        }
    });

    return connections;
};

const getPendingRequests = async (userId) => {
    const requests = await UserConnection.find({
        receiver: userId,
        status: 'pending',
    })
        .populate({
            path: 'sender',
            select: 'firstName lastName profilePicture displayName',
            populate: {
                path: 'userProfile',
                select: 'bio username', // We want both 'bio' and 'username' fields
            },
        })
        .lean();

    const flattenedRequests = requests.map((request) => {
        if (request.sender && request.sender.userProfile) {
            request.sender.bio = request.sender.userProfile.bio;
            request.sender.username = request.sender.userProfile.username;
            delete request.sender.userProfile;
        }
        return request;
    });

    return flattenedRequests;
};

const checkFriendshipStatus = async (userId, profileId) => {
    // Check BOTH directions separately for one-way follow system

    // Do I follow them? (userId -> profileId)
    const iFollowThem = await UserConnection.findOne({
        sender: userId,
        receiver: profileId,
    });

    // Do they follow me? (profileId -> userId)
    const theyFollowMe = await UserConnection.findOne({
        sender: profileId,
        receiver: userId,
    });

    // Check my status toward them
    const myStatus = iFollowThem?.status || null;
    const theirStatus = theyFollowMe?.status || null;

    // Priority 1: Check if I sent them a pending request
    if (myStatus === 'pending') {
        return 'requested';
    }

    // Priority 2: Check if they sent me a pending request
    if (theirStatus === 'pending') {
        return 'pending';
    }

    // Priority 3: Check if both follow each other (mutual)
    if (myStatus === 'accepted' && theirStatus === 'accepted') {
        return 'mutual';
    }

    // Priority 4: I follow them only (one-way)
    if (myStatus === 'accepted') {
        return 'following';
    }

    // Priority 5: They follow me only (one-way)
    if (theirStatus === 'accepted') {
        return 'follower';
    }

    // No connection
    return 'none';
};

const getRequest = async (userId, profileId) => {
    const friendship = await UserConnection.findOne({
        $or: [
            { sender: userId, receiver: profileId },
            { sender: profileId, receiver: userId },
        ],
    });
    return friendship ? friendship.id : null;
};

const count = async (filter = {}) => {
    return await UserConnection.countDocuments(filter);
};

const getUserList = async (userId, action = 'follower') => {
    const filter =
        action === 'follower' ? { receiver: userId, status: 'accepted' } : { sender: userId, status: 'accepted' };

    const populatePath = action === 'follower' ? 'sender' : 'receiver';

    const userList = await UserConnection.find(filter)
        .populate({
            path: populatePath,
            select: 'firstName lastName profilePicture displayName',
            populate: {
                path: 'userProfile',
                select: 'username',
            },
        })
        .lean();

    const users = userList.map((user) => {
        const userData = action === 'follower' ? user.sender : user.receiver;
        if (userData && userData.userProfile) {
            userData.username = userData.userProfile.username;
            delete userData.userProfile;
        }
        return userData;
    });

    return users;
};

module.exports = {
    checkFriendshipStatus,
    getUserList,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriends,
    getPendingRequests,
    getRequest,
    unfriend,
    count,
    find,
};
