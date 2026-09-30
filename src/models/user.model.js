const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const userSchema = mongoose.Schema(
    {
        firstName: {
            type: String,
            required: false,
            trim: true,
        },
        lastName: {
            type: String,
            required: false,
            trim: true,
        },
        fcmToken: {
            type: String,
        },
        displayName: {
            type: String,
        },
        dob: {
            type: Date,
        },
        profilePicture: {
            type: String,
        },
        stripe_customer_id: {
            type: String,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            validate(value) {
                if (!validator.isEmail(value)) {
                    throw new Error('Invalid email');
                }
            },
        },
        password: {
            type: String,
            required() {
                return this.provider === 'local';
            },
            trim: true,
            minlength: 8,
            validate: {
                validator(value) {
                    if (this.provider === 'local') {
                        return /(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>\-_])/.test(value);
                    }
                    // If the provider is not local, skip password validation.
                    return true;
                },
                message:
                    'Password must contain at least 8 characters, one uppercase letter, one number, and one special character',
            },
            private: true, // used by the toJSON plugin
        },
        role: {
            type: String,
            enum: roles,
            default: 'user',
        },
        // Email verification boolean (true when verified)
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        // Verification workflow status
        verificationStatus: {
            type: String,
            enum: ['unverified', 'on_review', 'verified'],
            default: 'unverified',
        },
        // New field to indicate the sign up method
        provider: {
            type: String,
            enum: ['local', 'google', 'apple'],
            default: 'local',
        },
        // Field to store Google unique identifier
        googleId: {
            type: String,
            trim: true,
            unique: true,
            sparse: true, // allows multiple docs without a googleId
        },
        // Field to store Apple unique identifier
        appleId: {
            type: String,
            trim: true,
            unique: true,
            sparse: true, // allows multiple docs without an appleId
        },
        // Verification documents
        driverLicense: {
            type: String,
            trim: true,
        },
        passport: {
            type: String,
            trim: true,
        },
        // Rejection reason if verification is rejected
        rejectionReason: {
            type: String,
            trim: true,
        },
        // User account status (separate from verification)
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspend'],
            default: 'active',
        },
        isProfileCompleted: {
            type: Boolean,
            default: false,
        },
        isPublicProfile: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
);

// add plugins that convert mongoose to JSON and add pagination
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
    const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
    return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
    const user = this;
    return bcrypt.compare(password, user.password);
};

// Only hash the password if the provider is local and the password field is modified.
userSchema.pre('save', async function (next) {
    const user = this;
    if (user.provider === 'local' && user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

userSchema.virtual('userProfile', {
    ref: 'userProfile',
    localField: '_id',
    foreignField: 'userId',
    justOne: true,
});
/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
