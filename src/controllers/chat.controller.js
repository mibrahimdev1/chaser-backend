const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { Chat, Report } = require('../models');
const LoginActivity = require('../models/loginActivity.model');
const { chatService, userService, reportService } = require('../services');
const catchAsync = require('../utils/catchAsync');
// const pick = require('../utils/pick');

const createChat = catchAsync(async (req, res) => {
    const { userId } = req.body;
    const body = {
        members: [userId, req.user.id],
        type: 'private',
    };
    const chat = await chatService.createChat(body);
    res.status(httpStatus.OK).send({ chat });
});

const createHuddle = catchAsync(async (req, res) => {
    const { name, members, description } = req.body;
    const body = {
        name,
        members: [...members, req.user.id],
        description,
        admin: [req.user.id],
        type: 'huddle',
    };
    const huddle = await chatService.createChat(body);
    res.status(httpStatus.CREATED).send({ huddle });
});

const sendMessage = catchAsync(async (req, res) => {
    const { message, chatId, senderId, content_type: contentType, isBot } = req.body;
    const newMessage = await chatService.saveMessage({
        chat_id: chatId,
        sender_id: senderId,
        content: message,
        contentType,
        isBot,
    });
    const chat = await chatService.getChatById(chatId);
    if (chat) {
        chat.lastMessage = newMessage._id;
        await chat.save();
    }
    // const file = req.file ? `/uploads/${req.file.filename}` : null;
    res.status(httpStatus.OK).send();
});

const report = catchAsync(async (req, res) => {
    const { content, chatId, reportType, reportedTo } = req.body;
    let whomReported = null;
    let reportedId = reportedTo || null;
    const chat = await Chat.findById(mongoose.Types.ObjectId(chatId));
    if (chat) {
        if (chat.type === 'private') {
            chat.active = false;
            whomReported = 'chat';
        } else {
            whomReported = 'huddle';
            // Remove the reported user from the members list
            const reportedUserId = chat.members.find((participant) => participant.toString() !== req.user.id);
            reportedId = reportedUserId;
            chat.members = chat.members.filter((member) => member.toString() !== reportedUserId);
            if (chat.admin && chat.admin === reportedUserId) {
                const [newAdmin] = chat.members;
                if (newAdmin) {
                    chat.admin = newAdmin;
                } else {
                    chat.active = false;
                }
            }
        }
        await chat.save();
        const reportDoc = new Report({
            reportedBy: req.user.id,
            reportedTo: chat.members.find((participant) => participant.toString() !== req.user.id.toString()), // Find the other participant
            reportType,
            type: whomReported,
            content,
        });
        await reportDoc.save();
    } else {
        const myuser = await userService.getUserById(req.user.id);
        if (myuser && reportedId) {
            if (!myuser.hiddenUsers.includes(reportedId)) {
                myuser.hiddenUsers.push(reportedId);
                await myuser.save();
            }
        }
        whomReported = 'user';
    }

    if (whomReported === 'user') {
        const reportDoc = new Report({
            reportedBy: req.user.id,
            reportedTo: reportedId,
            reportType,
            type: whomReported,
            content,
        });
        await reportDoc.save();
    }
    // const admin = await userService.getUserByRole('admin');
    // admin.forEach(async (user) => {
    //   await notificationService.sendNotification(user.fcmToken, {
    //     title: `${req.user.name} reported a ${whomReported} !`,
    //     message: `${req.user.name} reported a ${whomReported} !`,
    //     userId: user._id,
    //     notificationEnabled: true,
    //   });
    // });
    res.status(httpStatus.CREATED).send({ report });
});

const addPeopleInHuddle = catchAsync(async (req, res) => {
    const { chatId, userIds } = req.body;
    const chat = await Chat.findById(chatId);
    const chatmembers = chat.members.map((id) => id.toString());
    const duplicates = [];
    chatmembers.forEach((id) => {
        if (userIds.includes(id)) {
            duplicates.push(id);
        }
    });
    const uniqueValues = [...userIds, ...chatmembers].filter(
        (item, index) => [...userIds, ...chatmembers].indexOf(item) === index,
    );
    chat.members = uniqueValues;
    await chat.save();
    res.status(httpStatus.OK).send();
});

const removePeopleInHuddle = catchAsync(async (req, res) => {
    const { chatId, userId } = req.body;
    const chat = await Chat.findById(chatId);

    // If userId is not an array, convert it into an array
    const userIds = Array.isArray(userId) ? userId : [userId];

    // Filter out the members who are in the userIds array
    chat.members = chat.members.filter((id) => !userIds.includes(id.toString()));

    // If no members remain, set the chat as inactive
    if (chat.members.length === 0) {
        chat.active = false;
    }

    await chat.save();
    res.status(httpStatus.OK).send();
});

const leaveChat = catchAsync(async (req, res) => {
    const { action } = req.body;
    const { huddleId } = req.params;
    const chat = await Chat.findById(huddleId);

    if (!chat) {
        return res.status(httpStatus.NOT_FOUND).send({ message: 'Chat not found' });
    }
    switch (action) {
        case 'block': {
            chat.active = false;
            const user = await userService.getUserById(req.user.id);
            user.hiddenUsers.push(
                chat.members.find((participant) => participant.toString() !== req.user.id.toString()),
            );
            await user.save();
            break;
        }
        case 'leave':
            if (chat.type === 'private') {
                chat.active = false;
            } else {
                // Remove the current user from the members list
                chat.members = chat.members.filter((member) => member.toString() !== req.user.id.toString());

                // If the user leaving is the admin, reassign the admin or deactivate the chat
                if (chat.admin && chat.admin.toString() === req.user.id.toString()) {
                    const [newAdmin] = chat.members; // Destructure first member

                    if (newAdmin) {
                        chat.admin = newAdmin;
                    } else {
                        chat.active = false; // Deactivate chat if no members left
                    }
                }

                // Deactivate the chat if no members are left
                if (chat.members.length === 0) {
                    chat.active = false;
                }
            }
            break;

        default:
            return res.status(httpStatus.BAD_REQUEST).send({ message: 'Invalid action' });
    }

    await chat.save();
    res.status(httpStatus.OK).send({ message: 'Action performed successfully' });
});
const addHuddle = catchAsync(async (req, res) => {
    const { name, description, members, chatProfilePicture } = req.body;
    const chat = await Chat.create({
        name,
        active: true,
        description,
        members: [...members, req.user.id],
        admin: req.user.id,
        type: 'huddle',
        chatProfilePicture,
    });
    // const memberdocs = await User.find({
    //   _id: { $in: members },
    // })
    //   .select('fcmToken')
    //   .exec();
    // memberdocs
    //   .filter((docs) => docs.fcmToken)
    //   .forEach(async (docs) => {
    //     const { notificationService } = require('../services');

    //     // setImmediate(async () => {
    //     try {
    //       await notificationService.sendNotification(docs.fcmToken, {
    //         userId: docs._id,
    //         title: `You're added in "${name}" Huddle`,
    //         message: 'Explore Huddle and make new friends',
    //         notificationEnabled: docs.pushNotificationEnabled,
    //       });
    //     } catch (e) {}

    //     // });
    //   });

    res.status(httpStatus.CREATED).send({ chat });
});
const updateHuddle = catchAsync(async (req, res) => {
    const { chatId, ...restBody } = req.body;
    const updatedChat = await Chat.findByIdAndUpdate(chatId, { $set: restBody }, { new: true, runValidators: true });
    res.status(httpStatus.OK).send({ chat: updatedChat });
});

const getHuddle = catchAsync(async (req, res) => {
    const chats = await chatService.getChats(req.user.id, req.query);
    let socketUsers = await LoginActivity.find();
    if (socketUsers.length > 0) {
        socketUsers = socketUsers.map((itm) => itm.userId);
    } else {
        socketUsers = [];
    }
    res.status(httpStatus.OK).send({ chats, activeUsers: [...socketUsers] });
});

const getMessages = catchAsync(async (req, res) => {
    const { huddleId } = req.params;
    const messages = await chatService.getChatMessages(huddleId);
    res.status(httpStatus.OK).send(messages);
});

const getReports = catchAsync(async (req, res) => {
    const result = await reportService.getReports({ populate: ['reportedBy'] });
    res.status(httpStatus.OK).send(result);
});
module.exports = {
    createHuddle,
    sendMessage,
    report,
    addPeopleInHuddle,
    removePeopleInHuddle,
    updateHuddle,
    addHuddle,
    getHuddle,
    getMessages,
    leaveChat,
    createChat,
    getReports,
};
