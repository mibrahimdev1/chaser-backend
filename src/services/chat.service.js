const mongoose = require('mongoose');
const Chat = require('../models/chat.model');
const { Message, User, Notification } = require('../models');
const { actions, generateNotificationBody } = require('../config/notificationActions');
const admin = require('firebase-admin');

const createChat = async (body) => {
    const chat = await Chat.create(body);
    return chat;
};

const getChatByUserId = async (query) => {
    return await Chat.find(query);
};

const getChat = async (query) => {
    return await Chat.findOne(query);
};

const saveMessage = async (doc) => {
    const newMessage = new Message(doc);
    await newMessage.save();
    return newMessage;
};

/**
 * Send a private message and handle notifications
 * @param {Object} params - Message parameters
 * @param {string} params.chatId - Chat ID
 * @param {string} params.message - Message content
 * @param {string} params.senderId - Sender user ID
 * @param {string} params.contentType - Content type
 * @param {boolean} params.isBot - Is bot message
 * @param {Object} io - Socket.IO instance (optional, for emitting events)
 * @returns {Promise<Object>} Created message and chat
 */
const sendPrivateMessage = async ({ chatId, message, senderId, contentType, isBot = false }, io = null) => {
    const chat = await Chat.findById(chatId);
    if (!chat) {
        throw new Error('Chat not found');
    }

    if (!chat.active) {
        const errorMessage = {
            message: 'Chat is unavailable. Only you can see this message.',
            time: new Date(),
            sender_id: senderId,
            read: false,
            content_type: 'text',
        };
        if (io) {
            io.to(String(chatId)).emit('privateMessage', errorMessage);
        }
        return { message: null, chat, error: errorMessage };
    }

    const newMessage = new Message({
        chat_id: chatId,
        sender_id: senderId,
        content: message,
        content_type: contentType,
        isBot: isBot || false,
    });

    await newMessage.save();
    chat.lastMessage = newMessage._id;
    await chat.save();

    const senderIdStr = String(senderId);
    const receiverId = chat.members.find((itm) => itm.toString() !== senderIdStr);

    // Handle notifications if receiver exists
    if (receiverId) {
        const receiverIdStr = String(receiverId);

        const user = await User.findById(receiverId)
            .select('fcmToken firstName lastName displayName')
            .populate('userProfile', 'username')
            .lean();
        const senderUser = await User.findById(senderId)
            .select('firstName lastName displayName')
            .populate('userProfile', 'username')
            .lean();

        if (user && user.userProfile) {
            user.username = user.userProfile.username;
        }
        if (senderUser && senderUser.userProfile) {
            senderUser.username = senderUser.userProfile.username;
        }

        if (user && senderUser && io) {
            // Check if recipient is in the room
            const socketsInRoom = await io.in(String(chatId)).fetchSockets();
            const isRecipientInRoom = socketsInRoom.some((s) => String(s.data?.userId) === receiverIdStr);

            if (!isRecipientInRoom) {
                const senderName =
                    senderUser.username ||
                    senderUser.displayName ||
                    (senderUser.firstName && senderUser.lastName
                        ? `${senderUser.firstName} ${senderUser.lastName}`
                        : 'Someone');

                const truncatedMessage = message.length > 100 ? `${message.substring(0, 100)}...` : message;

                const notificationBody = generateNotificationBody(actions.MESSAGE, {
                    userName: senderName,
                    messageText: truncatedMessage,
                });

                const notificationTitle = `${senderName} sent you a message`;

                const metadata = {
                    chatId: String(chatId),
                    messageText: message,
                    senderId: senderIdStr,
                    action: actions.MESSAGE,
                };

                try {
                    const directNotification = await Notification.create({
                        title: notificationTitle,
                        action: actions.MESSAGE,
                        body: notificationBody,
                        user: receiverId,
                        company: null,
                        group: null,
                        metadata: metadata,
                    });

                    if (user.fcmToken) {
                        const dataPayload = { ...metadata, action: actions.MESSAGE };

                        const firebaseMessage = {
                            notification: { title: notificationTitle, body: notificationBody },
                            data: Object.keys(dataPayload).reduce((acc, key) => {
                                acc[key] = String(dataPayload[key]);
                                return acc;
                            }, {}),
                            token: user.fcmToken,
                        };

                        try {
                            await admin.messaging().send(firebaseMessage);
                        } catch (firebaseError) {
                            // Handle specific Firebase errors
                            if (firebaseError.code === 'messaging/registration-token-not-registered' ||
                                firebaseError.message === 'NotRegistered') {
                                // Token is invalid/expired - clear it from database
                                console.log(`[sendPrivateMessage] ⚠️ Invalid FCM token for user ${receiverIdStr}, clearing from database`);
                                await User.findByIdAndUpdate(receiverId, { fcmToken: null });
                            } else {
                                // Other Firebase errors (network, quota, etc.)
                                console.error(`[sendPrivateMessage] Firebase error:`, firebaseError.message);
                            }
                        }
                    }
                } catch (notificationError) {
                    console.error(`[sendPrivateMessage] Notification error:`, notificationError.message);
                }
            }
        }
    }

    const messageData = {
        message,
        time: newMessage.createdAt,
        sender_id: newMessage.sender_id,
        read: newMessage.read,
        isBot: newMessage.isBot,
        content_type: newMessage.content_type,
    };

    // Emit socket event if io is provided
    if (io) {
        io.to(String(chatId)).emit('privateMessage', messageData);
    }

    return { message: newMessage, chat, messageData };
};

/**
 * Send a group message
 * @param {Object} params - Message parameters
 * @param {string} params.chatId - Chat ID
 * @param {string} params.message - Message content
 * @param {string} params.senderId - Sender user ID
 * @param {string} params.contentType - Content type
 * @param {Object} io - Socket.IO instance (optional, for emitting events)
 * @returns {Promise<Object>} Created message and chat
 */
const sendGroupMessage = async ({ chatId, message, senderId, contentType }, io = null) => {
    const chat = await Chat.findById(chatId);
    if (!chat) {
        throw new Error('Chat not found');
    }

    if (!chat.active) {
        const errorMessage = {
            message: 'Chat is unavailable. Only you can see this message.',
            time: new Date(),
            sender_id: senderId,
            read: false,
            content_type: 'text',
        };
        if (io) {
            io.to(String(chatId)).emit('groupMessage', errorMessage);
        }
        return { message: null, chat, error: errorMessage };
    }

    const newMessage = new Message({
        chat_id: chatId,
        sender_id: senderId,
        content: message,
        content_type: contentType,
    });

    await newMessage.save();
    chat.lastMessage = newMessage._id;
    await chat.save();

    const messageData = {
        message,
        time: newMessage.createdAt,
        sender_id: newMessage.sender_id,
        read: newMessage.read,
        isBot: newMessage.isBot,
        content_type: newMessage.content_type,
    };

    // Emit socket event if io is provided
    if (io) {
        io.to(String(chatId)).emit('groupMessage', messageData);
    }

    return { message: newMessage, chat, messageData };
};

/**
 * Edit a message
 * @param {Object} params - Edit parameters
 * @param {string} params.messageId - Message ID
 * @param {string} params.newContent - New message content
 * @param {Object} io - Socket.IO instance (optional, for emitting events)
 * @returns {Promise<Object>} Updated message
 */
const editMessage = async ({ messageId, newContent }, io = null) => {
    const message = await Message.findById(messageId);
    if (!message) {
        throw new Error('Message not found');
    }

    const chat = await Chat.findById(message.chat_id);
    if (!chat || !chat.active) {
        throw new Error('Chat not found or inactive');
    }

    message.content = newContent;
    await message.save();

    const messageData = {
        message: message.content,
        time: message.createdAt,
        sender_id: message.sender_id,
        read: message.read,
        isBot: message.isBot,
        content_type: message.content_type,
    };

    // Emit socket event if io is provided
    if (io) {
        io.to(String(message.chat_id)).emit('editMessage', messageData);
    }

    return { message, messageData };
};

const getChats = async (userId, query) => {
    const { cursor, limit, type } = query;
    const queryOptions = { active: true, members: mongoose.Types.ObjectId(userId) };
    if (type === 'private') {
        // type: ,
        queryOptions.type = { $in: [type, 'ai'] };
    }
    if (type === 'huddle') {
        queryOptions.type = type;
    }

    if (cursor) {
        queryOptions._id = { $gt: mongoose.Types.ObjectId(cursor) };
    }

    const chats = await Chat.find(queryOptions)
        .limit(parseInt(limit, 10) || 10)
        .populate({
            path: 'members',
            select: 'firstName lastName displayName profilePicture',
            populate: {
                path: 'userProfile',
                select: 'username',
            },
        })
        .populate({
            path: 'lastMessage',
            select: 'content content_type sender_id read isBot createdAt updatedAt',
        })
        .sort({ 'lastMessage.updatedAt': -1 })
        .lean();

    chats.forEach((chat) => {
        if (chat.members) {
            chat.members.forEach((member) => {
                if (member.userProfile) {
                    member.username = member.userProfile.username;
                    delete member.userProfile;
                }
            });
        }
    });

    if (chats.length) {
        chats.sort((a, b) => {
            if (!a.lastMessage && !b.lastMessage) return 0;
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.updatedAt) - new Date(a.lastMessage.updatedAt);
        });
    }
    return chats;
};

const getChatMessages = async (huddleId) => {
    const messages = await Message.find({ chat_id: huddleId }).populate([
        {
            path: 'sender_id',
            select: 'name profilePicture phonenumber',
        },
    ]);
    return messages;
};

const getChatById = async (id) => {
    return await Chat.findById(id);
};

module.exports = {
    saveMessage,
    getChat,
    createChat,
    getChats,
    getChatMessages,
    getChatByUserId,
    getChatById,
    sendPrivateMessage,
    sendGroupMessage,
    editMessage,
};
