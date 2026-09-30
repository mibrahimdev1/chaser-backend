const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');
const { User } = require('../models');

const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
    // Case 1: No token provided (err or info is set by passport)
    if (err || info || !user) {
        if (info && info.message === 'No auth token') {
            return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication token is required'));
        }
        return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }

    req.user = user;

    // Case 2: Check if user is suspended
    if (user.status === 'suspend') {
        // Clear the FCM token to log out the user from all devices
        await User.findByIdAndUpdate(user._id, { fcmToken: null });
        return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Your account has been suspended'));
    }

    // Case 3: If user doesn't have the required rights
    if (requiredRights.length) {
        const userRights = roleRights.get(user.role);
        const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
        if (!hasRequiredRights && req.params.userId !== user.id) {
            return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
        }
    }

    resolve();
};

const auth =
    (...requiredRights) =>
    async (req, res, next) => {
        return new Promise((resolve, reject) => {
            passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(
                req,
                res,
                next,
            );
        })
            .then(() => next())
            .catch((err) => next(err));
    };

module.exports = auth;
