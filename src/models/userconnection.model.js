const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const userConnectionSchema = new mongoose.Schema(
    {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who sent the request
        receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User receiving the request
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
        },
    },
    { timestamps: true },
);

userConnectionSchema.plugin(toJSON);
// Ensure that a user cannot send duplicate requests
userConnectionSchema.index({ sender: 1, receiver: 1 }, { unique: false });

module.exports = mongoose.model('UserConnection', userConnectionSchema);
