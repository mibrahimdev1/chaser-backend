const httpStatus = require('http-status');
const { Job, Company } = require('../models');
const { agenda } = require('../jobs/agenda');
const { feedService } = require('.');
const ApiError = require('../utils/ApiError');

const createJob = async (data, userId) => {
    const jobData = {
        ...data,
        createdBy: userId,
    };
    const job = await Job.create(jobData);
    await Company.updateOne({ _id: data.companyId }, { $inc: { jobCount: 1 } });
    if (data.expiredAt) {
        await agenda.schedule(data.expiredAt, 'expire job', { jobId: job._id });
    }
    return job;
};

const queryJobs = async (filter, option) => {
    return await Job.paginate(filter, option);
};

const getAllJobs = async (filters) => {
    const query = {};
    if (filters.jobType) query.jobType = filters.jobType;
    if (filters.location) query.location = { $regex: filters.location, $options: 'i' };
    if (filters.industry) query.industry = filters.industry;
    if (filters.companyId) query.companyId = filters.companyId;
    return Job.find(query)
        .sort({ createdAt: -1 })
        .populate({ path: 'companyId', select: 'name profilePicture location' })
        .lean();
};

const getJobById = async (jobId, userId = null) => {
    const job = await Job.findById(jobId).populate('companyId').lean();

    if (!job) {
        return null;
    }

    // If userId is provided, check application status
    if (userId) {
        const application = job.applicants.find((app) => app.userId && app.userId.toString() === userId.toString());

        if (application) {
            job.applicationStatus = application.status; // pending, approve, or reject
        } else {
            job.applicationStatus = 'not_applied';
        }
    } else {
        job.applicationStatus = 'not_applied';
    }

    return job;
};

const updateJob = async (jobId, data) => {
    return Job.findByIdAndUpdate(jobId, data, { new: true });
};

const deleteJob = async (jobId) => {
    const job = await Job.findByIdAndDelete(jobId);
    if (job) {
        await Company.updateOne({ _id: job.companyId }, { $inc: { jobCount: -1 } });
    }
    return job;
};

const applyToJob = async (jobId, applicantData) => {
    // Check if user already applied
    const job = await Job.findById(jobId);
    if (!job) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
    }

    const existingApplication = job.applicants.find(
        (app) => app.userId && app.userId.toString() === applicantData.userId.toString(),
    );

    if (existingApplication) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'You have already applied to this job');
    }

    // Set status to pending when applying
    const applicationData = {
        ...applicantData,
        status: 'pending',
    };

    return Job.findByIdAndUpdate(jobId, { $push: { applicants: applicationData } }, { new: true });
};

const getApplicants = async (jobId) => {
    const job = await Job.findById(jobId).select('applicants');
    return job ? job.applicants : [];
};

const updateApplicantStatus = async (jobId, applicantId, status, userId) => {
    // Validate status
    const validStatuses = ['pending', 'approve', 'reject'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Get job and verify user has permission (must be the job creator)
    const job = await Job.findById(jobId);
    if (!job) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
    }

    // Check if user is the job creator
    const createdBy = job.createdBy ? job.createdBy.toString() : null;
    if (!createdBy || createdBy !== userId.toString()) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Only the job creator can update applicant status');
    }

    // Update applicant status
    return Job.findOneAndUpdate(
        { _id: jobId, 'applicants._id': applicantId },
        { $set: { 'applicants.$.status': status } },
        { new: true },
    );
};

const shareOnFeed = async (jobId, userId) => {
    const job = await getJobById(jobId);
    if (!job) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
    }
    const feedBody = {
        postType: 'job',
        companyId: job?.companyId,
        meta: {
            ...job,
        },
    };

    const feed = await feedService.createFeed(userId, feedBody);
    return feed;
};
module.exports = {
    createJob,
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob,
    applyToJob,
    getApplicants,
    updateApplicantStatus,
    shareOnFeed,
    queryJobs,
};
