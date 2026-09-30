const express = require('express');
const validate = require('../../middlewares/validate');
const authValidation = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);
router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword);
router.post('/send-verification-email', auth(), authController.sendVerificationEmail);
router.post('/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);
router.post('/verify-password', validate(authValidation.verifyEmail), authController.verifyPassword);
router.post('/googleauth', validate(authValidation.googleAuth), authController.googleAuth);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - displayName
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: First name (optional)
 *               lastName:
 *                 type: string
 *                 description: Last name (optional)
 *               username:
 *                 type: string
 *                 description: Unique username (optional, lowercase)
 *               dob:
 *                 type: string
 *                 format: date
 *                 description: Date of birth (YYYY-MM-DD) (optional)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Must be unique
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: At least one number, one uppercase letter, and one special character
 *               displayName:
 *                 type: string
 *                 description: Display name (required)
 *             example:
 *               displayName: John Doe
 *               username: johndoe
 *               email: johndoe@example.com
 *               password: Password@123
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 userProfile:
 *                   type: object
 *                   nullable: true
 *                   description: User profile (null if username not provided during registration)
 *                 tokens:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       "400":
 *         $ref: '#/components/responses/DuplicateEmail'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               email: johndoe@example.com
 *               password: Password@123
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 tokens:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       "401":
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: Invalid email or password
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *             example:
 *               refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZWJhYzUzNDk1NGI1NDEzOTgwNmMxMTIiLCJpYXQiOjE1ODkyOTg0ODQsImV4cCI6MTU4OTMwMDI4NH0.m1U63blB0MLej_WfB7yC2FTMnCziif9X8yzwDEfJXAg
 *     responses:
 *       "204":
 *         description: No content
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /auth/refresh-tokens:
 *   post:
 *     summary: Refresh auth tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *             example:
 *               refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZWJhYzUzNDk1NGI1NDEzOTgwNmMxMTIiLCJpYXQiOjE1ODkyOTg0ODQsImV4cCI6MTU4OTMwMDI4NH0.m1U63blB0MLej_WfB7yC2FTMnCziif9X8yzwDEfJXAg
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: An email will be sent to reset password.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *             example:
 *               email: fake@example.com
 *     responses:
 *       "204":
 *         description: No content
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The reset password token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: At least one number and one letter
 *             example:
 *               password: password1
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         description: Password reset failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: Password reset failed
 */

/**
 * @swagger
 * /auth/send-verification-email:
 *   post:
 *     summary: Send verification email
 *     description: An email will be sent to verify email.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sid:
 *                   type: string
 *                   example: "XXXXX"
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email using OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - otp
 *             properties:
 *               token:
 *                 type: string
 *                 description: JWT token containing the hashed OTP
 *               otp:
 *                 type: string
 *                 description: The 6-digit OTP provided by the user
 *           example:
 *             token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOnsib3RwIjoiMTIzNDU2IiwidXNlciI6IjY3YTI1OTZjZDNkZWZhMTFiMDc5Yjk0MyJ9LCJpYXQiOjE3Mzg4NDU2NTIsImV4cCI6MTczODg0NjI1Mn0.fVq0rFQERmfZEzy6wcQIopbympIIMKg9i6cEyqApmnI"
 *             otp: "123456"
 *     responses:
 *       "204":
 *         description: Email verified successfully, no content returned
 *       "400":
 *         description: Bad request, missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 400
 *               message: "OTP is required"
 *       "401":
 *         description: Unauthorized, OTP verification failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: "Incorrect OTP"
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 500
 *               message: "Internal server error"
 */

/**
 * @swagger
 * /auth/verify-password:
 *   post:
 *     summary: Verify password using OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - otp
 *             properties:
 *               token:
 *                 type: string
 *                 description: JWT token containing the hashed OTP
 *               otp:
 *                 type: string
 *                 description: The 6-digit OTP provided by the user
 *           example:
 *             token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOnsib3RwIjoiMTIzNDU2IiwidXNlciI6IjY3YTI1OTZjZDNkZWZhMTFiMDc5Yjk0MyJ9LCJpYXQiOjE3Mzg4NDU2NTIsImV4cCI6MTczODg0NjI1Mn0.fVq0rFQERmfZEzy6wcQIopbympIIMKg9i6cEyqApmnI"
 *             otp: "123456"
 *     responses:
 *       "200":
 *         description: Password verified successfully, no content returned
 *       "400":
 *         description: Bad request, missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 400
 *               message: "OTP is required"
 *       "401":
 *         description: Unauthorized, OTP verification failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: "Incorrect OTP"
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 500
 *               message: "Internal server error"
 */

/**
 * @swagger
 * /auth/googleauth:
 *   post:
 *     summary: Authenticate or register a user with Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - token
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [signup, login]
 *                 description: Determines if the user is signing up or logging in.
 *               token:
 *                 type: string
 *                 description: Google OAuth access token.
 *               fcmToken:
 *                 type: string
 *                 nullable: true
 *                 description: Firebase Cloud Messaging token (optional).
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       example: "user"
 *                     isEmailVerified:
 *                       type: boolean
 *                       example: true
 *                     provider:
 *                       type: string
 *                       example: "google"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     email:
 *                       type: string
 *                       example: "johndoe@example.com"
 *                     profilePicture:
 *                       type: string
 *                       example: "https://example.com/profile.jpg"
 *                     googleId:
 *                       type: string
 *                       example: "1234567890"
 *                     id:
 *                       type: string
 *                       example: "abcdef123456"
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     access:
 *                       type: object
 *                       properties:
 *                         token:
 *                           type: string
 *                           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                         expires:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-02-07T13:49:10.722Z"
 *                     refresh:
 *                       type: object
 *                       properties:
 *                         token:
 *                           type: string
 *                           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                         expires:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-03-09T13:19:10.722Z"
 *       400:
 *         description: Bad request (e.g., email already taken)
 *       401:
 *         description: Unauthorized (invalid token, user not found, or wrong provider)
 */
