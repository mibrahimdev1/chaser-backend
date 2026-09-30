const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const loginActivitySchema = mongoose.Schema(
    {
        action: {
            type: String,
            default: 'login',
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        ipAddress: {
            type: String,
            default: '0.0.0.0',
        },
        location: {
            type: String,
            default: 'unknown',
        },
    },
    {
        timestamps: true,
    },
);

loginActivitySchema.plugin(toJSON);
loginActivitySchema.plugin(paginate);
loginActivitySchema.index({ userId: 1, timestamp: -1 });

const LoginActivity = mongoose.model('LoginActivity', loginActivitySchema);

module.exports = LoginActivity;
