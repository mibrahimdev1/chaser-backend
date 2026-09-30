const express = require('express');
const validate = require('../../middlewares/validate');
const { jobValidation } = require('../../validations');
const { jobController } = require('../../controllers');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.post('/', auth(), validate(jobValidation.createJob), jobController.createJob);
router.get('/', jobController.getAllJobs);
router.get('/getallJobs', auth(), jobController.getJobs);
router.get('/:id', auth(), validate(jobValidation.jobIdParam), jobController.getJobById);
router.put('/:id', auth(), validate(jobValidation.updateJob), jobController.updateJob);
router.delete('/:id', auth(), validate(jobValidation.jobIdParam), jobController.deleteJob);
router.post('/:id/apply', auth(), validate(jobValidation.applyToJob), jobController.applyToJob);
router.post('/:id/shareOnFeed', auth(), validate(jobValidation.jobIdParam), jobController.shareOnFeed);
router.get('/:id/applicants', auth(), validate(jobValidation.jobIdParam), jobController.getApplicants);
router.patch(
    '/:jobId/applicants/:applicantId',
    auth(),
    validate(jobValidation.updateApplicantStatus),
    jobController.updateApplicantStatus,
);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job management
 *
 * /jobs:
 *   post:
 *     summary: Create a job
 *     description: Create a new job posting.
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Job'
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Invalid input
 *
 *   get:
 *     summary: Get all jobs
 *     description: Retrieve a list of all jobs with optional filters.
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *         description: Filter jobs by type (e.g., full-time, part-time, remote).
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter jobs by location (case-insensitive search).
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter jobs by industry.
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Filter jobs by company ID.
 *     responses:
 *       200:
 *         description: A list of jobs.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *
 * /jobs/{id}:
 *   get:
 *     summary: Get job by ID
 *     description: Retrieve job details by ID. If authenticated, includes applicationStatus field showing the current user's application status (not_applied, pending, approve, or reject).
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 job:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     applicationStatus:
 *                       type: string
 *                       enum: [not_applied, pending, approve, reject]
 *                       description: Application status for the authenticated user
 *       404:
 *         description: Job not found
 *
 *   put:
 *     summary: Update job by ID
 *     description: Update job details.
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Job'
 *     responses:
 *       200:
 *         description: Job updated successfully
 *       400:
 *         description: Invalid input
 *
 *   delete:
 *     summary: Delete job by ID
 *     description: Remove a job listing.
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       404:
 *         description: Job not found
 *
 * /jobs/{id}/apply:
 *   post:
 *     summary: Apply to a job
 *     description: Submit an application for a job.
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Application'
 *     responses:
 *       200:
 *         description: Application submitted successfully
 *       400:
 *         description: Invalid input
 *
 * components:
 *   schemas:
 *     Job:
 *       type: object
 *       properties:
 *         companyId:
 *           type: string
 *           description: The ID of the company posting the job
 *         title:
 *           type: string
 *           description: The job title
 *         description:
 *           type: string
 *           description: Job description
 *         location:
 *           type: string
 *           description: Job location
 *         jobType:
 *           type: string
 *           enum: [Full-time, Part-time, Remote, Contract]
 *         salary:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *             currency:
 *               type: string
 *               default: USD
 *             payType:
 *               type: string
 *               enum: [Hourly, Monthly, Yearly]
 *     Application:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         resume:
 *           type: string
 *           description: URL of the resume
 */

/**
 * @swagger
 * /jobs/{id}/apply:
 *   post:
 *     summary: Apply for a job
 *     description: Submit an application for a job.
 *     security:
 *       - bearerAuth: []
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 description: Applicant's name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Applicant's email
 *               phone:
 *                 type: string
 *                 description: Applicant's phone number (optional)
 *               resume:
 *                 type: string
 *                 description: URL to resume (optional)
 *               about:
 *                 type: string
 *                 description: Short description about the applicant (optional)
 *     responses:
 *       200:
 *         description: Successfully applied
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */

/**
 * @swagger
 * /jobs/{id}/applicants:
 *   get:
 *     summary: Get job applicants
 *     description: Retrieve all applicants who applied for a job.
 *     security:
 *       - bearerAuth: []
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: A list of applicants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 applicants:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         description: User ID of applicant
 *                       name:
 *                         type: string
 *                         description: Applicant's name
 *                       email:
 *                         type: string
 *                         format: email
 *                         description: Applicant's email
 *                       phone:
 *                         type: string
 *                         description: Applicant's phone number
 *                       resume:
 *                         type: string
 *                         description: Resume URL
 *                       about:
 *                         type: string
 *                         description: Short bio
 *                       status:
 *                         type: string
 *                         enum: [not_applied, pending, approve, reject]
 *                         description: Application status
 *                       appliedAt:
 *                         type: string
 *                         format: date-time
 *                         description: Date of application
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */

/**
 * @swagger
 * /jobs/{jobId}/applicants/{applicantId}:
 *   patch:
 *     summary: Update applicant status
 *     description: Change the status of an applicant (e.g., Shortlisted, Rejected, Hired).
 *     security:
 *       - bearerAuth: []
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *       - in: path
 *         name: applicantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Applicant ID
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
 *                 enum: [pending, approve, reject]
 *                 description: New status of the applicant (pending, approve, or reject)
 *     responses:
 *       200:
 *         description: Applicant status updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job or applicant not found
 */
