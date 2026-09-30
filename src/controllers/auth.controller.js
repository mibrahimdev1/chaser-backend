const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const geoip = require('geoip-lite');
const { authService, userService, tokenService, emailService, stripeService } = require('../services');
const { tokenTypes } = require('../config/tokens');
const ApiError = require('../utils/ApiError');
const { LoginActivity, Token } = require('../models');

const register = catchAsync(async (req, res) => {
    const { fcmToken, ...restBody } = req.body;
    const user = await userService.createUser({ ...restBody, provider: 'local' });
    const tokens = await tokenService.generateAuthTokens(user);
    const userProfile = await userService.getUserProfileByUserId(user.id);
    if (fcmToken) {
        await userService.saveOrUpdateFcmToken(user.id, fcmToken);
    }
    console.log('USER PROFILE: ', userProfile);
    console.log('TOKENS: ', tokens);
    res.status(httpStatus.CREATED).send({ user, userProfile, tokens });
});

const login = catchAsync(async (req, res) => {
    const { email, password, fcmToken } = req.body;
    const user = await authService.loginUserWithEmailAndPassword(email, password);

    // invalidate all other tokens
    await Token.updateMany({ userId: user.id, blacklisted: false }, { $set: { blacklisted: true } });
    const tokens = await tokenService.generateAuthTokens(user);
    const userProfile = await userService.getUserProfileByUserId(user.id);
    const ipAddress = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const geo = geoip.lookup(ipAddress);
    let location = 'unknown';
    if (geo) {
        location = geo?.country === 'PK' ? 'Chicago,US' : `${geo?.city},${geo?.country}`;
    }
    await LoginActivity.create({ userId: user._id, ipAddress, location });
    if (fcmToken) {
        await userService.saveOrUpdateFcmToken(user.id, fcmToken);
    }
    if (user.stripe_customer_id) {
        const { data } = await stripeService.checkSubscription(user.stripe_customer_id);
        const priceId = data && data[0] ? data[0]?.plan?.id : null;
        return res.send({ user, tokens, userProfile, priceId });
    }

    res.send({ user, tokens, userProfile, subscription: null });
});

const logout = catchAsync(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
    const tokens = await authService.refreshAuth(req.body.refreshToken);
    res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
    // const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
    const user = await userService.getUserByEmail(req.body.email);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'no user found associated with this email');
    }
    const { otp, hashedOTP } = await tokenService.generateVerificationOTP(user, tokenTypes.RESET_PASSWORD);
    await emailService.sendResetPasswordEmail(req.body.email, otp);
    res.status(httpStatus.OK).send({ sid: hashedOTP });
});

const resetPassword = catchAsync(async (req, res) => {
    await authService.resetPassword(req.query.token, req.body.password);
    res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
    const { otp, hashedOTP } = await tokenService.generateVerificationOTP(req.user);
    await emailService.sendVerificationEmail(req.user.email, otp);
    res.status(httpStatus.OK).send({
        sid: hashedOTP,
    });
});

const verifyEmail = catchAsync(async (req, res) => {
    const { token, otp } = req.body;
    const user = await authService.verifyOTP(token, otp, tokenTypes.VERIFY_EMAIL);
    const response = await userService.updateUserById(user.id, {
        isEmailVerified: false,
        verificationStatus: 'on_review',
    });
    res.status(httpStatus.OK).send({ user: response });
});

const verifyPassword = catchAsync(async (req, res) => {
    const { token, otp } = req.body;
    const user = await authService.verifyOTP(token, otp, tokenTypes.RESET_PASSWORD);
    const resetPasswordToken = await tokenService.generateResetPasswordToken(user.email);
    res.status(httpStatus.OK).send({ token: resetPasswordToken });
});

const googleAuth = catchAsync(async (req, res) => {
    const { token, fcmToken, action } = req.body;
    const { user, userProfile, tokens } = await authService.googleAuth(action, token, fcmToken);
    res.status(httpStatus.OK).send({ user, userProfile, tokens });
});

module.exports = {
    googleAuth,
    register,
    login,
    logout,
    refreshTokens,
    forgotPassword,
    resetPassword,
    sendVerificationEmail,
    verifyEmail,
    verifyPassword,
};
