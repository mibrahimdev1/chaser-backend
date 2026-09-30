const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { tokenTypes } = require('../config/tokens');
const { User } = require('../models');

/**
 * Socket.IO authentication middleware
 * Validates JWT token from handshake auth or query params
 */
const socketAuth = async (socket, next) => {
    try {
        // Try to get token from handshake auth (recommended)
        let token = socket.handshake.auth?.token || socket.handshake.query?.token;

        // Fallback to Authorization header if available
        if (!token && socket.handshake.headers?.authorization) {
            token = socket.handshake.headers.authorization.replace('Bearer ', '');
        }

        if (!token) {
            console.log(`[Socket Auth] ❌ No token provided for socket ${socket.id}`);
            const error = new Error('Authentication token required');
            error.data = { statusCode: 401 };
            return next(error);
        }

        // Verify JWT token
        const payload = jwt.verify(token, config.jwt.secret);

        // Check token type
        if (payload.type !== tokenTypes.ACCESS) {
            console.log(`[Socket Auth] ❌ Invalid token type for socket ${socket.id}`);
            const error = new Error('Invalid token type');
            error.data = { statusCode: 401 };
            return next(error);
        }

        // For access tokens, JWT verification is sufficient
        // Access tokens are stateless and don't need to be checked in database
        // (Only refresh tokens are stored in DB for revocation purposes)

        // Get user
        const user = await User.findById(payload.sub);
        if (!user) {
            console.log(`[Socket Auth] ❌ User not found for socket ${socket.id}`);
            const error = new Error('User not found');
            error.data = { statusCode: 401 };
            return next(error);
        }

        // Check if user is suspended
        if (user.status === 'suspend') {
            console.log(`[Socket Auth] ❌ User suspended for socket ${socket.id}`);
            await User.findByIdAndUpdate(user._id, { fcmToken: null });
            const error = new Error('Your account has been suspended');
            error.data = { statusCode: 401 };
            return next(error);
        }

        // Attach user to socket
        socket.data.user = user;
        socket.data.userId = String(user._id);
        socket.data.authenticated = true;

        console.log(`[Socket Auth] ✅ Authenticated socket ${socket.id} for user ${user._id}`);

        next();
    } catch (error) {
        console.error(`[Socket Auth] ❌ Authentication error for socket ${socket.id}:`, error.message);
        const authError = new Error(
            error instanceof jwt.JsonWebTokenError
                ? 'Invalid token'
                : error instanceof jwt.TokenExpiredError
                  ? 'Token expired'
                  : 'Authentication failed',
        );
        authError.data = { statusCode: 401 };
        return next(authError);
    }
};

module.exports = socketAuth;

