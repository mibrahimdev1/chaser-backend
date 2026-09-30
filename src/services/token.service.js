const jwt = require('jsonwebtoken');
const moment = require('moment');
const httpStatus = require('http-status');
const config = require('../config/config');
const userService = require('./user.service');
const { Token } = require('../models');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');

/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
    const payload = {
        sub: userId,
        iat: moment().unix(),
        exp: expires.unix(),
        type,
    };
    return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (token, userId, expires, type, blacklisted = false) => {
    const tokenDoc = await Token.create({
        token,
        user: userId,
        expires: expires.toDate(),
        type,
        blacklisted,
    });
    return tokenDoc;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type) => {
    const payload = jwt.verify(token, config.jwt.secret);
    const tokenDoc = await Token.findOne({ token, type, user: payload.sub, blacklisted: false });
    if (!tokenDoc) {
        throw new Error('Token not found');
    }
    return tokenDoc;
};

const verifyOTPToken = async (token, type) => {
    const payload = jwt.verify(token, config.jwt.secret);
    const tokenDoc = await Token.findOne({ token, user: payload.sub && payload.sub.user, type, blacklisted: false });
    if (!tokenDoc) {
        throw new Error('Token not found');
    }
    return tokenDoc;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user) => {
    const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS);

    const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
    const refreshToken = generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH);
    await saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);

    return {
        access: {
            token: accessToken,
            expires: accessTokenExpires.toDate(),
        },
        refresh: {
            token: refreshToken,
            expires: refreshTokenExpires.toDate(),
        },
    };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email) => {
    const user = await userService.getUserByEmail(email);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
    }
    const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
    const resetPasswordToken = generateToken(user.id, expires, tokenTypes.RESET_PASSWORD);
    await saveToken(resetPasswordToken, user.id, expires, tokenTypes.RESET_PASSWORD);
    return resetPasswordToken;
};

/**
 * Generate verify email token
 * @param {User} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (user) => {
    const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
    const verifyEmailToken = generateToken(user.id, expires, tokenTypes.VERIFY_EMAIL);
    await saveToken(verifyEmailToken, user.id, expires, tokenTypes.VERIFY_EMAIL);
    return verifyEmailToken;
};

/**
 * Generate a 6-digit OTP
 * @returns {string} OTP
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
/**
 * Generate a hashed OTP using JWT
 * @param {string} otp - The OTP to hash
 * @returns {string} Hashed OTP
 */
// function hashOTP(otp) {
//   const secret = config.jwt.secret;
//   return jwt.sign({ sub: otp, iat: moment().unix(), exp: expires.unix() }, secret); // OTP valid for 10 minutes
// }

/**
 * Generate a verification OTP
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateVerificationOTP = async (user, tokenType = tokenTypes.VERIFY_EMAIL) => {
    let otp = null;
    // if (config.env === 'development') {
    //   otp = '123456';
    // } else {
    otp = generateOTP();
    // }
    const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
    const hashedOTP = jwt.sign(
        { sub: { otp, user: user.id }, iat: moment().unix(), exp: expires.unix() },
        config.jwt.secret,
    );
    await saveToken(hashedOTP, user.id, expires, tokenType);
    return { otp, hashedOTP };
};

module.exports = {
    generateToken,
    saveToken,
    verifyToken,
    generateAuthTokens,
    generateResetPasswordToken,
    generateVerifyEmailToken,
    generateVerificationOTP,
    verifyOTPToken,
};
