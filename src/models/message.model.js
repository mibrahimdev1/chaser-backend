const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const messageSchema = mongoose.Schema(
    {
        chat_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
        sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        content_type: { type: String, enum: ['text', 'media', 'voicenote'], required: true },
        read: { type: Boolean, default: false },
        isBot: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    },
);

messageSchema.plugin(toJSON);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
