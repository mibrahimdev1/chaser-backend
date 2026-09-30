const express = require('express');
const auth = require('../../middlewares/auth');
const { companyController } = require('../../controllers');
const validate = require('../../middlewares/validate');
const companyValidation = require('../../validations/company.validation');

const router = express.Router();

router
    .route('/')
    .post(auth(), validate(companyValidation.createCompany), companyController.createCompany)
    .get(auth(), companyController.getCompanies);

router.get('/export', auth('manageUsers'), companyController.exportCompanies);
router.get('/:companyId/media', auth(), companyController.getCompanyMedia);
router
    .route('/:companyId')
    .get(auth(), companyController.getCompanyDetails)
    .patch(auth('manageUsers'), validate(companyValidation.updateCompany), companyController.updateCompany);
router.post('/:companyId/feed', auth(), companyController.postCompanyFeed);
router.get('/:companyId/feeds', auth(), companyController.getCompanyFeeds);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company management and retrieval
 */

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Create a company
 *     description: Allows a user to create a company.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Tech Solutions"
 *               tagline:
 *                 type: string
 *                 example: "Innovating the Future"
 *               about:
 *                 type: string
 *                 example: "We are a cutting-edge tech company."
 *               profilePicture:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/profile.jpg"
 *               coverImage:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/cover.jpg"
 *               companySize:
 *                 type: string
 *                 enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]
 *                 example: "11-50"
 *               websiteUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://techsolutions.com"
 *               category:
 *                 type: string
 *                 example: "Software"
 *               industry:
 *                 type: string
 *                 example: "Technology"
 *               location:
 *                 type: string
 *                 example: "London, UK"
 *     responses:
 *       200:
 *         description: Company created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 company:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "65c12345abcd67890ef12345"
 *                     name:
 *                       type: string
 *                       example: "Tech Solutions"
 *                     tagline:
 *                       type: string
 *                       example: "Innovating the Future"
 *                     about:
 *                       type: string
 *                       example: "We are a cutting-edge tech company."
 *                     profilePicture:
 *                       type: string
 *                       format: uri
 *                     coverImage:
 *                       type: string
 *                       format: uri
 *                     size:
 *                       type: string
 *                       enum: ["1-10", "11-50", "51-200", "201-500", "500+"]
 *                     websiteUrl:
 *                       type: string
 *                       format: uri
 *                     industry:
 *                       type: string
 *                       example: "Technology"
 *                     jobCount:
 *                       type: number
 *                       default: 0
 *                     postCount:
 *                       type: number
 *                       default: 0
 *                     memberCount:
 *                       type: number
 *                       default: 1
 *                     location:
 *                       type: string
 *                       example: "London, UK"
 *                     country:
 *                       type: string
 *                       example: "United Kingdom"
 *                     city:
 *                       type: string
 *                       example: "London"
 *                     state:
 *                       type: string
 *                       example: "England"
 *                     zipcode:
 *                       type: string
 *                     verificationStatus:
 *                       type: string
 *                       enum: [pending, verified]
 *                       default: pending
 *                     status:
 *                       type: string
 *                       enum: [active, inactive]
 *                       default: active
 *                     owner:
 *                       type: string
 *                       description: User ID of the company owner
 *                     admins:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Array of admin user IDs
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error or company name already exists
 *       401:
 *         description: Unauthorized
 *
 *   get:
 *     summary: Get companies
 *     description: Retrieve a list of companies. Admins can access all companies; users can only see their own.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *           example: "Tech"
 *         description: (Optional) Search companies by name.
 *       - name: userId
 *         in: query
 *         schema:
 *           type: string
 *         description: (Optional) Search companies by user.
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Pagination page number.
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of companies per page.
 *     responses:
 *       200:
 *         description: A list of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of companies
 *                   example: 50
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   description: Number of companies per page
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                   example: 5
 *                 companies:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "65c12345abcd67890ef12345"
 *                       name:
 *                         type: string
 *                         example: "Tech Solutions"
 *                       tagline:
 *                         type: string
 *                         example: "Innovating the Future"
 *                       about:
 *                         type: string
 *                         example: "We are a cutting-edge tech company."
 *                       profilePicture:
 *                         type: string
 *                         format: uri
 *                       coverImage:
 *                         type: string
 *                         format: uri
 *                       size:
 *                         type: string
 *                         enum: ["1-10", "11-50", "51-200", "201-500", "500+"]
 *                       websiteUrl:
 *                         type: string
 *                         format: uri
 *                       industry:
 *                         type: string
 *                       jobCount:
 *                         type: number
 *                         description: Number of active jobs
 *                         example: 15
 *                       postCount:
 *                         type: number
 *                         description: Number of published posts
 *                         example: 42
 *                       memberCount:
 *                         type: number
 *                         description: Number of company members/admins
 *                         example: 25
 *                       location:
 *                         type: string
 *                       country:
 *                         type: string
 *                       city:
 *                         type: string
 *                       state:
 *                         type: string
 *                       zipcode:
 *                         type: string
 *                       verificationStatus:
 *                         type: string
 *                         enum: [pending, verified]
 *                       status:
 *                         type: string
 *                         enum: [active, inactive]
 *                       admins:
 *                         type: array
 *                         items:
 *                           type: string
 *                       owner:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /companies/export:
 *   get:
 *     summary: Export all companies to Excel
 *     description: Only admins can export companies data to Excel format.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel file with all companies data
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
 * /companies/{companyId}:
 *   get:
 *     summary: Get company details by ID
 *     description: Retrieve detailed information about a specific company including owner and admins.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the company
 *     responses:
 *       200:
 *         description: Company details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 company:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "65c12345abcd67890ef12345"
 *                     name:
 *                       type: string
 *                       example: "Tech Solutions"
 *                     tagline:
 *                       type: string
 *                       example: "Innovating the Future"
 *                     about:
 *                       type: string
 *                       example: "We are a cutting-edge tech company."
 *                     profilePicture:
 *                       type: string
 *                       format: uri
 *                       example: "https://example.com/profile.jpg"
 *                     coverImage:
 *                       type: string
 *                       format: uri
 *                       example: "https://example.com/cover.jpg"
 *                     size:
 *                       type: string
 *                       enum: ["1-10", "11-50", "51-200", "201-500", "500+"]
 *                       example: "11-50"
 *                     websiteUrl:
 *                       type: string
 *                       format: uri
 *                       example: "https://techsolutions.com"
 *                     industry:
 *                       type: string
 *                       example: "Technology"
 *                     jobCount:
 *                       type: number
 *                       example: 15
 *                     postCount:
 *                       type: number
 *                       example: 42
 *                     memberCount:
 *                       type: number
 *                       example: 25
 *                     location:
 *                       type: string
 *                       example: "London, UK"
 *                     country:
 *                       type: string
 *                       example: "United Kingdom"
 *                     city:
 *                       type: string
 *                       example: "London"
 *                     state:
 *                       type: string
 *                       example: "England"
 *                     zipcode:
 *                       type: string
 *                       example: "SW1A 1AA"
 *                     verificationStatus:
 *                       type: string
 *                       enum: [pending, verified]
 *                       example: "verified"
 *                     status:
 *                       type: string
 *                       enum: [active, inactive]
 *                       example: "active"
 *                     owner:
 *                       type: object
 *                       description: Company owner details
 *                     admins:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: List of company admins
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 */

/**
 * @swagger
 * /companies/{companyId}/media:
 *   get:
 *     summary: Get media posts by company
 *     description: Retrieve all image posts (media) associated with a specific company. Returns only posts that contain image media files.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the company whose media posts to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved media posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Post ID
 *                         example: "65c12345abcd67890ef12345"
 *                       media:
 *                         type: array
 *                         description: Array of image media items
 *                         items:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                               format: uri
 *                               description: URL of the image
 *                               example: "https://example.com/image.jpg"
 *                             type:
 *                               type: string
 *                               enum: [image]
 *                               description: Type of media (always 'image' for this endpoint)
 *                               example: "image"
 *       401:
 *         description: Unauthorized, authentication required
 *       404:
 *         description: Company not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /companies/{companyId}/feed:
 *   post:
 *     summary: Create a company feed post
 *     description: Create a new post on a company's feed. Only company admins can post.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the company
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - caption
 *             properties:
 *               caption:
 *                 type: string
 *                 description: Post caption/text
 *                 example: "Excited to announce our new product launch!"
 *               media:
 *                 type: array
 *                 description: Array of media items (optional)
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       format: uri
 *                       example: "https://example.com/image.jpg"
 *                     type:
 *                       type: string
 *                       enum: [image, video, gif, document]
 *                       example: "image"
 *               status:
 *                 type: string
 *                 enum: [published, scheduled, draft]
 *                 default: published
 *                 description: Post status
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post created successfully"
 *                 post:
 *                   type: object
 *                   description: The created post object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only company admins can post
 *       404:
 *         description: Company not found
 */

/**
 * @swagger
 * /companies/{companyId}/feeds:
 *   get:
 *     summary: Get company feed posts
 *     description: Retrieve all feed posts associated with a specific company, sorted by creation date (newest first).
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the company whose feeds to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved company feeds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   description: Array of feed posts
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "65c12345abcd67890ef12345"
 *                       userId:
 *                         type: object
 *                         description: User who created the post
 *                       companyId:
 *                         type: string
 *                         description: Company ID
 *                       caption:
 *                         type: string
 *                         example: "Excited to announce our new product launch!"
 *                       media:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                             type:
 *                               type: string
 *                               enum: [image, video, gif, document]
 *                       status:
 *                         type: string
 *                         enum: [published, scheduled, draft, suspended]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 *       500:
 *         description: Internal server error
 */
