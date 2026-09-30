const httpStatus = require('http-status');
const { jobService } = require('../services');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');

const createJob = catchAsync(async (req, res) => {
    const job = await jobService.createJob(req.body, req.user.id);
    res.status(httpStatus.CREATED).send({ job });
});

const getJobs = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['jobType', 'companyId', 'industry', 'location']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    options.populate = 'companyId';
    const result = await jobService.queryJobs(filter, options);
    res.send(result);
});

const getAllJobs = catchAsync(async (req, res) => {
    let jobs = await jobService.getAllJobs(req.query);
    jobs = jobs.map((job) => ({ ...job, company: job.companyId, companyId: job.companyId._id }));
    res.send({ jobs });
});

const getJobById = catchAsync(async (req, res) => {
    const userId = req.user ? req.user.id : null;
    const job = await jobService.getJobById(req.params.id, userId);
    if (!job) return res.status(httpStatus.NOT_FOUND).send({ message: 'Job not found' });
    res.send({ job });
});

const updateJob = catchAsync(async (req, res) => {
    const updatedJob = await jobService.updateJob(req.params.id, req.body);
    res.send({ job: updatedJob });
});

const deleteJob = catchAsync(async (req, res) => {
    await jobService.deleteJob(req.params.id);
    res.status(httpStatus.NO_CONTENT).send();
});

const applyToJob = catchAsync(async (req, res) => {
    const job = await jobService.applyToJob(req.params.id, { ...req.body, userId: req.user.id });
    res.status(httpStatus.CREATED).send({ job });
});

const getApplicants = catchAsync(async (req, res) => {
    const applicants = await jobService.getApplicants(req.params.id);
    res.status(httpStatus.OK).send({ applicants });
});

const updateApplicantStatus = catchAsync(async (req, res) => {
    const updatedJob = await jobService.updateApplicantStatus(
        req.params.jobId,
        req.params.applicantId,
        req.body.status,
        req.user.id,
    );
    res.status(httpStatus.OK).send({ job: updatedJob });
});

const shareOnFeed = catchAsync(async (req, res) => {
    // console.log(req.user.id);
    const job = await jobService.shareOnFeed(req.params.id, req.user.id);
    res.status(httpStatus.OK).send({ job });
});

module.exports = {
    createJob,
    getJobs,
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob,
    applyToJob,
    getApplicants,
    updateApplicantStatus,
    shareOnFeed,
};
