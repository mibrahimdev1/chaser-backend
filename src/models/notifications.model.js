const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const notificationSchema = mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
        group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
        title: { type: String, required: true },
        body: { type: String, required: true },
        action: { type: String, required: true },
        metadata: {
            type: mongoose.Schema.Types.Mixed, // Flexible field for storing metadata
            required: false,
        },
        read: {
            type: Boolean,
            default: false, // Default to unread
        },
    },
    { timestamps: true },
);

notificationSchema.plugin(toJSON);

const Notifications = mongoose.model('Notifications', notificationSchema);

module.exports = Notifications;
