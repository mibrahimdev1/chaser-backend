const mongoose = require('mongoose');

const helpCenterSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the User model
            required: true,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    },
);

const HelpCenter = mongoose.model('HelpCenter', helpCenterSchema);

module.exports = HelpCenter;
