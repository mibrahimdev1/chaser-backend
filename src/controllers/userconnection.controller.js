const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { userconnectionService, chatService, userService, notificationService } = require('../services');
const ApiError = require('../utils/ApiError');
const { generateNotificationBody, actions } = require('../config/notificationActions');

const sendFriendRequest = catchAsync(async (req, res) => {
    const { receiverId } = req.body;
    const senderId = req.user.id;
    const recieverUser = await userService.getUserById(receiverId);
    if (!recieverUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    const friendRequest = await userconnectionService.sendFriendRequest(senderId, receiverId);

    const senderWithProfile = await userService.getUserById(senderId);
    const senderName =
        senderWithProfile?.username || req.user.displayName || `${req.user.firstName} ${req.user.lastName}`;

    // If auto-accepted (public profile), create/activate chat immediately
    if (friendRequest.status === 'accepted') {
        try {
            const chat = await chatService.getChat({ members: { $all: [senderId, receiverId] } });
            if (chat) {
                chat.active = true;
                await chat.save();
            } else {
                await chatService.createChat({ members: [senderId, receiverId], type: 'private', active: true });
            }

            // Send "follow request" notification even when auto-accepted
            // The notification should indicate someone wants to follow, not that they accepted
            await notificationService.sendNotificationToUser(
                recieverUser.fcmToken,
                'New Friend Request',
                generateNotificationBody(actions.FOLLOW_REQUEST, { userName: senderName }),
                { userId: receiverId, companyId: null, groupId: null },
                { userId: req.user.id, icon: req.user.profilePicture },
                true,
                actions.FOLLOW_REQUEST,
            );
            // eslint-disable-next-line no-empty
        } catch (error) {}
    } else {
        // Send normal friend request notification
        try {
            await notificationService.sendNotificationToUser(
                recieverUser.fcmToken,
                'New Friend Request',
                generateNotificationBody(actions.FOLLOW_REQUEST, { userName: senderName }),
                { userId: receiverId, companyId: null, groupId: null },
                { userId: req.user.id, icon: req.user.profilePicture },
                true,
                actions.FOLLOW_REQUEST,
            );
            // eslint-disable-next-line no-empty
        } catch (error) {}
    }

    res.status(httpStatus.CREATED).send({ request: friendRequest });
});

const getUserList = catchAsync(async (req, res) => {
    const { action, userId } = req.query;
    const users = await userconnectionService.getUserList(userId || req.user.id, action);
    return res.status(httpStatus.OK).send({ users });
});

const acceptFriendRequest = catchAsync(async (req, res) => {
    const { requestId } = req.params;
    const userId = req.user.id;

    const friendRequest = await userconnectionService.acceptFriendRequest(requestId, userId);
    const chat = await chatService.getChat({ members: { $all: [friendRequest.sender, friendRequest.receiver] } });
    if (chat) {
        chat.active = true;
        await chat.save();
    } else {
        await chatService.createChat({
            members: [friendRequest.sender, friendRequest.receiver],
            type: 'private',
            active: true,
        });
    }
    res.status(httpStatus.OK).send({ request: friendRequest });
    try {
        const senderDoc = await userService.getUserById(friendRequest.sender);
        const receiverWithProfile = await userService.getUserById(userId);
        const receiverName =
            receiverWithProfile?.username || req.user.displayName || `${req.user.firstName} ${req.user.lastName}`;

        if (senderDoc) {
            const senderName =
                senderDoc.username || senderDoc.displayName || `${senderDoc.firstName} ${senderDoc.lastName}`;
            // for sender
            await notificationService.sendNotificationToUser(
                senderDoc.fcmToken,
                `${receiverName} accepted your friend request`,
                generateNotificationBody(actions.FOLLOW_ACCEPTED, { userName: receiverName }),
                { userId: senderDoc._id, companyId: null, groupId: null },
                { userId: req.user.id, icon: req.user.profilePicture },
                true,
                actions.FOLLOW_ACCEPTED,
            );

            // for reciever
            await notificationService.sendNotificationToUser(
                req.user.fcmToken,
                `${senderName} has followed you`,
                `${senderName} has followed you`,
                { userId: friendRequest.receiver.toString(), companyId: null, groupId: null },
                { userId: senderDoc._id.toString(), icon: senderDoc.profilePicture },
                true,
                actions.FOLLOW_ACCEPTED,
            );
        }

        // eslint-disable-next-line no-empty
    } catch (error) {
        // console.log(error);
    }
});

const rejectFriendRequest = catchAsync(async (req, res) => {
    const { requestId } = req.params;
    const userId = req.user.id;

    await userconnectionService.rejectFriendRequest(requestId, userId);
    res.status(httpStatus.OK).send();
});

const getFriends = catchAsync(async (req, res) => {
    const userId = req.user.id;

    const friends = await userconnectionService.getFriends(userId);

    res.status(httpStatus.OK).send({ friends });
});

const getPendingRequests = catchAsync(async (req, res) => {
    const userId = req.user.id;

    const requests = await userconnectionService.getPendingRequests(userId);

    res.status(httpStatus.OK).send({ requests });
});

const unfriend = catchAsync(async (req, res) => {
    const { requestId } = req.params;
    const friendRequest = await userconnectionService.find({ _id: requestId });
    if (!friendRequest) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
    }
    const chat = await chatService.getChat({ members: { $all: [friendRequest.sender, friendRequest.receiver] } });
    if (chat) {
        chat.active = false;
        await chat.save();
    }
    const deletedConnection = await userconnectionService.unfriend(requestId);
    if (!deletedConnection) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Request not found');
    }
    res.status(httpStatus.OK).send();
});
module.exports = {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriends,
    getPendingRequests,
    unfriend,
    getUserList,
};
