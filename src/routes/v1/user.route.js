const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const userController = require('../../controllers/user.controller');

const router = express.Router();

router
    .route('/')
    .post(auth('manageUsers'), validate(userValidation.createUser), userController.createUser)
    .get(validate(userValidation.getUsers), userController.getUsers);

router.route('/syncdb').post(userController.addNewFieldToAllDocuments);

router.route('/updateProfile').patch(auth(), validate(userValidation.updateProfile), userController.updateUserProfile);

router.get('/me', auth(), userController.getMe);
router.patch(
    '/togglePublicProfile',
    auth(),
    validate(userValidation.togglePublicProfile),
    userController.togglePublicProfile,
);
router.get('/suggestedUsers', auth(), userController.getSuggestedUsers);
router.get('/export', auth('manageUsers'), userController.exportUsers);
router.patch(
    '/:userId/status',
    auth('manageUsers'),
    validate(userValidation.updateUserStatusByAdmin),
    userController.updateUserStatusByAdmin,
);
router.patch(
    '/:userId/verification',
    auth('manageUsers'),
    validate(userValidation.updateUserVerificationByAdmin),
    userController.updateUserVerificationByAdmin,
);
router.patch(
    '/:userId/password',
    auth('manageUsers'),
    validate(userValidation.updateUserPasswordByAdmin),
    userController.updateUserPasswordByAdmin,
);
router
    .route('/:userId')
    .get(auth(), validate(userValidation.getUser), userController.getUser)
    .patch(auth(), validate(userValidation.updateUser), userController.updateUser)
    .delete(auth('manageUsers'), validate(userValidation.deleteUser), userController.deleteUser);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and retrieval
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a user
 *     description: Only admins can create other users.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *                 description: must be unique
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: At least one number and one letter
 *               role:
 *                  type: string
 *                  enum: [user, admin]
 *             example:
 *               name: fake name
 *               email: fake@example.com
 *               password: password1
 *               role: user
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/User'
 *       "400":
 *         $ref: '#/components/responses/DuplicateEmail'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all users
 *     description: Only admins can retrieve all users. By default, users with `verificationStatus = 'on_review'` are shown at the top for easy admin review.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: User name
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: User role
 *       - in: query
 *         name: verificationStatus
 *         schema:
 *           type: string
 *           enum: [unverified, on_review, verified]
 *         description: Filter by verification status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc (ex. name:asc). If not provided, users are sorted by verification priority (on_review first).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of users
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user
 *     description: Logged in users can fetch only their own user information. Only admins can fetch other users.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/User'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update a user
 *     description: Logged in users can only update their own information. Only admins can update other users.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *                 description: must be unique
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: At least one number and one letter
 *             example:
 *               name: fake name
 *               email: fake@example.com
 *               password: password1
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/User'
 *       "400":
 *         $ref: '#/components/responses/DuplicateEmail'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete a user
 *     description: Logged in users can delete only themselves. Only admins can delete other users.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User id
 *     responses:
 *       "200":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /users/updateProfile:
 *   patch:
 *     summary: Update the user profile
 *     description: |
 *       Allows users to update their profile details. `dob`, `profilePicture`, `driverLicense`, and `passport` are stored in the `User` model, while other fields are stored in the `UserProfile` model.
 *
 *       **Automatic Verification Status:**
 *       - Uploading `driverLicense` or `passport` → `verificationStatus = 'on_review'`
 *       - Removing both documents → `verificationStatus = 'unverified'`
 *       - Admin verification required to get `verificationStatus = 'verified'` (then `isEmailVerified = true`)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1995-06-15"
 *               profilePicture:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/profile.jpg"
 *               driverLicense:
 *                 type: string
 *                 format: uri
 *                 description: URL of the driver license image for verification. Uploading this will change isEmailVerified to 'on_review'.
 *                 example: "https://example.com/documents/license.jpg"
 *               passport:
 *                 type: string
 *                 format: uri
 *                 description: URL of the passport image for verification. Uploading this will change isEmailVerified to 'on_review'.
 *                 example: "https://example.com/documents/passport.jpg"
 *               displayName:
 *                 type: string
 *                 example: "John Doe"
 *               username:
 *                 type: string
 *                 example: "johndoe"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: "male"
 *               bio:
 *                 type: string
 *                 example: "Software developer with a passion for open-source projects."
 *               address:
 *                 type: string
 *                 example: "123 Main Street, Apt 4B"
 *               country:
 *                 type: string
 *                 example: "USA"
 *               state:
 *                 type: string
 *                 example: "California"
 *               city:
 *                 type: string
 *                 example: "Los Angeles"
 *               zipcode:
 *                 type: string
 *                 example: "90001"
 *               chasingCategory:
 *                 type: string
 *                 example: "Technology"
 *               description:
 *                 type: string
 *                 example: "I am passionate about coding and innovation."
 *     responses:
 *       200:
 *         description: Successfully updated profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "67a60784453ab766148f5c08"
 *                     dob:
 *                       type: string
 *                       format: date
 *                       example: "1995-06-15"
 *                     profilePicture:
 *                       type: string
 *                       format: uri
 *                       example: "https://example.com/profile.jpg"
 *                 userProfile:
 *                   type: object
 *                   properties:
 *                     displayName:
 *                       type: string
 *                       example: "John Doe"
 *                     username:
 *                       type: string
 *                       example: "johndoe"
 *                     gender:
 *                       type: string
 *                       example: "male"
 *                     bio:
 *                       type: string
 *                       example: "Software developer with a passion for open-source projects."
 *                     address:
 *                       type: string
 *                       example: "123 Main Street, Apt 4B"
 *                     country:
 *                       type: string
 *                       example: "USA"
 *                     state:
 *                       type: string
 *                       example: "California"
 *                     city:
 *                       type: string
 *                       example: "Los Angeles"
 *                     zipcode:
 *                       type: string
 *                       example: "90001"
 *                     chasingCategory:
 *                       type: string
 *                       example: "Technology"
 *                     description:
 *                       type: string
 *                       example: "I am passionate about coding and innovation."
 *       400:
 *         description: Bad request (invalid input)
 *       401:
 *         description: Unauthorized (token required)
 */

/**
 * @swagger
 * /users/suggestedUsers:
 *   get:
 *     summary: Get suggested users based on various factors
 *     description: Retrieves a list of suggested users based on industry, location, interests, education, or recent sign-ups. Excludes already connected users.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *         description: The number of users per category (max 20).
 *       - in: query
 *         name: factor
 *         required: false
 *         schema:
 *           type: string
 *           enum: [peopleInYourIndustry, peopleFromYourLocation, peopleWithSimilarInterests, peopleWithSimilarEducation, newUsers]
 *         description: Retrieve users based on a specific factor. If omitted, returns all categories.
 *     responses:
 *       200:
 *         description: Successfully retrieved suggested users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 peopleInYourIndustry:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserProfile'
 *                 peopleFromYourLocation:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserProfile'
 *                 peopleWithSimilarInterests:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserProfile'
 *                 peopleWithSimilarEducation:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserProfile'
 *                 newUsers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Invalid factor provided.
 *       404:
 *         description: User profile not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /users/export:
 *   get:
 *     summary: Export all users to Excel
 *     description: Only admins can export users data to Excel format.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel file with all users data
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized - Access token is missing or invalid
 *       403:
 *         description: Forbidden - Only admins can access this endpoint
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /users/{userId}/password:
 *   patch:
 *     summary: Update user password (Admin only)
 *     description: Allows admins to directly update any user's password. Only works for users with local authentication (not Google/Apple login).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID whose password will be updated
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
 *                 minLength: 8
 *                 description: New password (must contain at least 8 characters, 1 letter, 1 number, and 1 special character)
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password updated successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *       400:
 *         description: Bad request - Invalid password format or user has social login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidPassword:
 *                 summary: Invalid password format
 *                 value:
 *                   code: 400
 *                   message: "password must be at least 8 characters"
 *               socialLogin:
 *                 summary: User has social login
 *                 value:
 *                   code: 400
 *                   message: "Cannot update password for users with social login (Google/Apple)"
 *       401:
 *         description: Unauthorized - Access token is missing or invalid
 *       403:
 *         description: Forbidden - Only admins can access this endpoint
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 404
 *               message: "User not found"
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /users/{userId}/status:
 *   patch:
 *     summary: Update user account status (Admin only)
 *     description: Allows admins to update user account status (active, inactive, suspend). This is separate from email verification.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID whose status will be updated
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspend]
 *                 description: The new account status for the user
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User account status updated to active"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     status:
 *                       type: string
 *                       example: "active"
 *       400:
 *         description: Bad request - Invalid status
 *       401:
 *         description: Unauthorized - Access token is missing or invalid
 *       403:
 *         description: Forbidden - Only admins can access this endpoint
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /users/{userId}/verification:
 *   patch:
 *     summary: Update user verification status (Admin only)
 *     description: |
 *       Allows admins to update user verification status (unverified, on_review, verified).
 *       When set to 'verified', the `isEmailVerified` boolean is automatically set to `true`.
 *       This is separate from account status.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID whose verification status will be updated
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - verificationStatus
 *             properties:
 *               verificationStatus:
 *                 type: string
 *                 enum: [unverified, on_review, verified]
 *                 description: The new verification status for the user
 *                 example: "verified"
 *               rejectionReason:
 *                 type: string
 *                 description: Optional reason for rejection or additional notes
 *                 example: "Documents are not clear or invalid"
 *     responses:
 *       200:
 *         description: Verification status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User verification status updated to verified"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     isEmailVerified:
 *                       type: boolean
 *                       example: true
 *                       description: Automatically set to true when verificationStatus is 'verified'
 *                     verificationStatus:
 *                       type: string
 *                       example: "verified"
 *                     rejectionReason:
 *                       type: string
 *                       example: null
 *       400:
 *         description: Bad request - Invalid verification status
 *       401:
 *         description: Unauthorized - Access token is missing or invalid
 *       403:
 *         description: Forbidden - Only admins can access this endpoint
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
