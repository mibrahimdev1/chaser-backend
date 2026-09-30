const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const chatSchema = mongoose.Schema(
    {
        type: { type: String, enum: ['private', 'huddle'], required: true },
        name: { type: String, default: null }, // null for private chats
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
        admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null for private chats
        lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
        description: { type: String, default: null }, // null for private chats
        active: { type: Boolean, default: true },
        chatProfilePicture: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

chatSchema.plugin(toJSON);

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
