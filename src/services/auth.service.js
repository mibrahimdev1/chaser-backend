const httpStatus = require('http-status');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const tokenService = require('./token.service');
const userService = require('./user.service');
const Token = require('../models/token.model');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');
const { tokenTypes } = require('../config/tokens');
const { User } = require('../models');
/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
    const user = await userService.getUserByEmail(email);

    if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
    }
    if (user.provider !== 'local') {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
    }
    if (!(await user.isPasswordMatch(password))) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
    }
    if (user.status === 'suspend') {
        throw new ApiError(
            httpStatus.UNAUTHORIZED,
            'Your account has been suspended by Chaser. Please contact support.',
        );
    }
    if (user.status === 'inactive') {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Your account has been deactivated. Please contact support.');
    }
    return user;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
    const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false });
    if (!refreshTokenDoc) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
    }
    await refreshTokenDoc.remove();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
    try {
        const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
        const user = await userService.getUserById(refreshTokenDoc.user);
        if (!user) {
            throw new Error();
        }
        await refreshTokenDoc.remove();
        return tokenService.generateAuthTokens(user);
    } catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
    try {
        const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
        const user = await userService.getUserById(resetPasswordTokenDoc.user);
        if (!user) {
            throw new Error();
        }
        await userService.updateUserById(user.id, { password: newPassword });
        await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });
    } catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
    }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */
const verifyEmail = async (verifyEmailToken) => {
    try {
        const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
        const user = await userService.getUserById(verifyEmailTokenDoc.user);
        if (!user) {
            throw new Error();
        }
        await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
        await userService.updateUserById(user.id, { isEmailVerified: true });
    } catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
    }
};

const verifyOTP = async (token, otp, tokenType) => {
    // try {
    const verifyEmailTokenDoc = await tokenService.verifyOTPToken(token, tokenType);
    const user = await userService.getUserById(verifyEmailTokenDoc.user);
    if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'OTP Verification Failed');
    }
    const decoded = jwt.verify(token, config.jwt.secret);

    if (!decoded.sub.otp) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired OTP');
    }
    if (decoded.sub.otp !== otp) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect OTP');
    }
    await Token.deleteMany({ user: user.id, type: tokenType });
    return user;
    // return await userService.updateUserById(user.id, { isEmailVerified: true });
    // } catch (error) {
    //   throw new ApiError(httpStatus.UNAUTHORIZED, 'OTP verification failed');
    // }
};

const googleAuth = async (action, token, fcmToken) => {
    const userInfo = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`);
    const googleUserData = userInfo.data;
    if (!googleUserData || !googleUserData.email) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid Google token');
    }
    let user = await User.findOne({ email: googleUserData.email });
    let userProfile = null;
    if (action === 'signup') {
        if (!user) {
            // throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
            user = await User.create({
                firstName: googleUserData.given_name || '',
                lastName: googleUserData.family_name || '',
                email: googleUserData.email,
                profilePicture: googleUserData.picture || '',
                provider: 'google',
                googleId: googleUserData.id,
                isEmailVerified: false,
                verificationStatus: 'on_review', // Google users need to upload documents
                status: 'active',
                fcmToken,
            });
        }
        userProfile = await userService.getUserProfileByUserId(user.id);
    } else if (action === 'login') {
        if (!user) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
        }
        if (user.provider !== 'google') {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Use email/password to login');
        }
        userProfile = await userService.getUserProfileByUserId(user.id);
        if (fcmToken) {
            await userService.saveOrUpdateFcmToken(user.id, fcmToken);
        }
    }

    const tokens = await tokenService.generateAuthTokens(user);
    return { user, userProfile, tokens };
};

module.exports = {
    loginUserWithEmailAndPassword,
    logout,
    refreshAuth,
    resetPassword,
    verifyEmail,
    verifyOTP,
    googleAuth,
};
