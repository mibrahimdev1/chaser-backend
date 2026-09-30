const socketIo = require('socket.io');
const { BatchContact, User, Chat, Notification } = require('../models');
const { Message } = require('../models');
const { sendNotificationToUser } = require('./notification.service');
const { actions, generateNotificationBody } = require('../config/notificationActions');
const LoginActivity = require('../models/loginActivity.model');
const socketAuth = require('../middlewares/socketAuth');
const chatService = require('./chat.service');

let io;
const clients = {};
const users = {};
const userIds = [];

const initializeSocket = (server) => {
    console.log('🚀 [Socket] Initializing Socket.IO server...');
    io = socketIo(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    console.log('✅ [Socket] Socket.IO server initialized');

    // Apply authentication middleware to all connections
    io.use(socketAuth);

    io.on('connection', (socket) => {
        // User is already authenticated at this point (via socketAuth middleware)
        const userId = socket.data.userId;
        console.log(`🔌 [Socket] Authenticated client connected: ${socket.id}, userId: ${userId}`);

        // Log ALL incoming events
        const onevent = socket.onevent;
        socket.onevent = function (packet) {
            const args = packet.data || [];
            console.log(`📥 [Socket] INCOMING EVENT: '${args[0]}' on socket ${socket.id}`, args.slice(1));
            return onevent.call(this, packet);
        };

        // Handle user joining
        socket.on('activeUsers', async () => {
            const userDocs = await User.find({ _id: { $in: userIds.map((itm) => itm.split('split')[1]) } })
                .select('profilePicture name email city country pictures dob')
                .exec();

            const finalData = await Promise.all(
                userDocs.map(async (itm) => {
                    const existingLogin = await LoginActivity.findOne({ userId: itm._id });
                    if (!existingLogin) {
                        // If not, add a new login activity entry for the user
                        const newLoginActivity = new LoginActivity({ userId: itm._id });
                        await newLoginActivity.save();
                    }
                    // Logging for debugging

                    return {
                        profilePicture: itm.profilePicture,
                        name: itm.name,
                        email: itm.email,
                        id: itm._id,
                        pictures: itm.pictures,
                        age: 0,
                        lives_in: `${itm.city}, ${itm.country.toLowerCase()}`,
                    };
                }),
            );

            io.emit('activeUsers', finalData);
        });

        socket.on('active', async (activeUserId) => {
            // Verify userId matches authenticated user
            if (String(activeUserId) !== userId) {
                console.log(`[active] ❌ Unauthorized: userId ${activeUserId} does not match authenticated userId ${userId}`);
                return;
            }

            userIds.push(`${socket.id}split${activeUserId}`);
            const userDocs = await User.find({ _id: { $in: userIds.map((itm) => itm.split('split')[1]) } })
                .select('profilePicture name email city country pictures dob')
                .exec();
            const finalData = await Promise.all(
                userDocs.map(async (itm) => {
                    // Logging for debugging

                    return {
                        profilePicture: itm.profilePicture,
                        name: itm.name,
                        email: itm.email,
                        id: itm._id,
                        pictures: itm.pictures,
                        age: 0,
                        lives_in: `${itm.city}, ${itm.country.toLowerCase()}`,
                    };
                }),
            );

            io.emit('activeUsers', finalData);
        });

        // socket.on('join', ({ userId, chatId }) => {
        //   users[socket.id] = userId;
        //   socket.join(chatId);
        //   io.emit('userList', users);
        // });

        socket.on('join', ({ userId: joinUserId, chatId }) => {
            // Verify userId matches authenticated user
            if (String(joinUserId) !== userId) {
                console.log(`[join] ❌ Unauthorized: userId ${joinUserId} does not match authenticated userId ${userId}`);
                return;
            }

            users[socket.id] = joinUserId;
            socket.join(chatId);
            io.emit('userList', users);
        });

        socket.on('typing', (chatId) => {
            io.to(chatId).emit('typing', { user: users[socket.id] });
        });

        socket.on('stopTyping', (chatId) => {
            io.to(chatId).emit('stopTyping', { user: users[socket.id] });
        });

        // socket.on('groupMessage', async ({ chatId, message, senderId, content_type }) => {
        //   const chat = await Chat.findById(chatId);
        //   const newMessage = new Message({
        //     chat_id: chatId,
        //     sender_id: senderId,
        //     content: message,
        //     content_type: content_type,
        //   });
        //   const recieverIds = chat.members.filter((itm) => itm.toString() !== senderId);
        //   console.log("chat members: ", chat.members);
        //   console.log("recievers: ", recieverIds);
        //   if (recieverIds.length) {
        //     recieverIds.forEach(async (id) => {
        //       const user = await User.findById(id);
        //       if (user) {
        //         await sendNotification(user.fcmToken, {
        //           title: 'you got a new message!',
        //           message: `you got a new message!`,
        //           notificationEnabled: user.pushNotificationEnabled
        //         });
        //       }
        //     });
        //   }
        //   await newMessage.save();
        //   chat.lastMessage = newMessage._id;
        //   await chat.save();

        //   io.to(chatId).emit('groupMessage', {
        //     message,
        //     time: newMessage.createdAt,
        //     sender_id: newMessage.sender_id,
        //     read: newMessage.read,
        //     content_type: newMessage.content_type,
        //   });
        //   // io.emit('groupMessage', message);
        // });

        socket.on('groupMessage', async ({ chatId, message, senderId, content_type: contentType }) => {
            try {
                // Verify sender matches authenticated user
                if (String(senderId) !== userId) {
                    console.log(`[groupMessage] ❌ Unauthorized: senderId ${senderId} does not match authenticated userId ${userId}`);
                    return;
                }

                // Use service method to handle message creation and emit event
                await chatService.sendGroupMessage({ chatId, message, senderId, contentType }, io);
            } catch (error) {
                console.error('[groupMessage] Error:', error.message);
            }
        });

        socket.on('privateMessage', async ({ chatId, message, senderId, content_type: contentType, isBot }) => {
            console.log('🔵 [privateMessage] ========== EVENT RECEIVED ==========');
            console.log('🔵 [privateMessage] Data:', { chatId, senderId, hasMessage: !!message, contentType, isBot });

            try {
                // Verify sender matches authenticated user
                if (String(senderId) !== userId) {
                    console.log(`[privateMessage] ❌ Unauthorized: senderId ${senderId} does not match authenticated userId ${userId}`);
                    return;
                }

                // Use service method to handle message creation, notifications, and emit event
                await chatService.sendPrivateMessage({ chatId, message, senderId, contentType, isBot }, io);
            } catch (error) {
                console.error('[privateMessage] Error:', error.message);
            }
        });

        socket.on('editMessage', async ({ messageId, newContent }) => {
            try {
                // Verify message belongs to authenticated user
                const message = await Message.findById(messageId);
                if (!message) {
                    console.log(`[editMessage] Message not found: ${messageId}`);
                    return;
                }

                if (String(message.sender_id) !== userId) {
                    console.log(`[editMessage] ❌ Unauthorized: message sender does not match authenticated userId`);
                    return;
                }

                // Use service method to handle message edit and emit event
                await chatService.editMessage({ messageId, newContent }, io);
            } catch (error) {
                console.error('[editMessage] Error:', error.message);
            }
        });

        socket.on('checkStatus', async (chatId) => {
            const chat = await Chat.findById(chatId);
            if (chat.active) {
                io.to(chatId).emit('checkStatus', {
                    status: true,
                });
            } else {
                io.to(chatId).emit('checkStatus', {
                    status: false,
                });
            }
        });

        socket.on('disconnect', async () => {
            const userDocs = await User.find({ _id: { $in: userIds.map((itm) => itm.split('split')[1]) } })
                .select('profilePicture name email')
                .exec();
            // if (userDocs.length) {
            //   await Promise.all(
            //     userDocs.map(async (itm) => {
            //       const existingLogin = await LoginActivity.findOne({ userId: itm._id });
            //       if (existingLogin) {
            //         await existingLogin.deleteOne();
            //       }
            //     })
            //   );
            // }
            userIds.pop(userIds.find((itm) => itm.split('split')[0] === socket.id));
            delete users[socket.id];
            io.emit('userList', users);
            io.emit(
                'activeUsers',
                userDocs.map((itm) => ({
                    profilePicture: itm.profilePicture,
                    name: itm.name,
                    email: itm.email,
                    id: itm._id,
                })),
            );
        });

        // batch subscription
        socket.on('subscribeToBatch', (batchId) => {
            clients[batchId] = socket.id; // Associate the client with the batch ID
        });
    });
};

// Batch process

// Function to start batch processing
const startBatchProcess = async (contacts) => {
    if (!Array.isArray(contacts) || contacts.length === 0) {
        throw new Error('Contacts should be a non-empty array');
    }

    // Save contacts to the database
    const batchContact = new BatchContact({ contacts });
    await batchContact.save();

    const batchId = batchContact._id.toString(); // Use the MongoDB ID as the batch ID
    const results = await Promise.all(
        contacts.map(async (number) => {
            const user = await User.findOne(
                { phonenumber: number },
                { _id: 1, email: 1, phonenumber: 1, profilePicture: 1, name: 1 }, // Projection to return only the specified fields
            );
            return user
                ? {
                      number,
                      registered: true,
                      user: {
                          id: user._id,
                          email: user.email,
                          name: user.name,
                          phonenumber: user.phonenumber,
                          profilePicture: user.profilePicture,
                      },
                  }
                : null;
        }),
    );

    // Filter out null entries (unregistered users)
    const filteredResults = results.filter((result) => result !== null);

    // setTimeout(() => {
    //   //for testing only
    //   // Process contacts in the background after delay
    //   processContactsInBackground(batchId);
    // }, 5000); // 5000 milliseconds = 5 seconds

    return { message: 'Batch processing started', batchId, result: filteredResults };
};
// const processContactsInBackground = async (batchContactId) => {
//   const batchContact = await BatchContact.findById(batchContactId);
//   if (!batchContact) {
//     throw new Error('BatchContact not found');
//   }

//   const { contacts } = batchContact;
//   const batchSize = 50; // Process 50 contacts at a time
//   for (let i = 0; i < contacts.length; i += batchSize) {
//     const batch = contacts.slice(i, i + batchSize);
//     await processBatch(batch, batchContactId);
//   }

//   // Delete the batch contacts from the database after processing
//   await BatchContact.findByIdAndDelete(batchContactId);
// };

// const processBatch = async (batch, batchContactId) => {
//   const results = await Promise.all(
//     batch.map(async (number) => {
//       const user = await User.findOne({ phonenumber: number });
//       return user ? { number, registered: true, user } : null;
//     })
//   );

//   // Filter out null entries (unregistered users)
//   const filteredResults = results.filter((result) => result !== null);

//   // Send filtered results to the specific WebSocket client
//   // const socketId = clients[batchContactId];
//   // if (socketId) {
//   io.to(clients[batchContactId]).emit('batchResult', { data: filteredResults });
//   // }
// };
module.exports = { initializeSocket, startBatchProcess, userIds };
