const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { Company, Feed, Job } = require('../models');
const ApiError = require('../utils/ApiError');
const { feedService } = require('.');
const XLSX = require('xlsx');

const createCompany = async (userId, data) => {
    const existingCompany = await Company.findOne({ name: data.name });
    if (existingCompany) throw new ApiError(httpStatus.BAD_REQUEST, 'Company name already exists');

    const company = await Company.create({
        ...data,
        owner: userId,
        admins: [userId],
        memberCount: 1, // Initialize memberCount with the creator
    });

    return company;
};
const getCompanyDetails = async (companyId) => {
    const company = await Company.findById(companyId).populate('owner admins').lean();
    if (!company) throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');

    // Count posts for the company
    const postCount = await Feed.countDocuments({
        companyId: companyId,
        status: 'published', // Only count published posts
    });

    // Count jobs for the company
    const jobCount = await Job.countDocuments({
        companyId: companyId,
        isActive: true, // Only count active jobs
    });

    // Calculate memberCount from admins array length if not set
    const memberCount = company.memberCount || (company.admins ? company.admins.length : 0);

    // Add calculated counts to company object
    return {
        ...company,
        jobCount: jobCount || company.jobCount || 0,
        postCount: postCount || company.postCount || 0,
        memberCount: memberCount,
    };
};

const postCompanyFeed = async (userId, companyId, postData) => {
    const company = await Company.findById(companyId);
    if (!company) throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');

    if (!company.admins.includes(userId)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only company admins can post on this page');
    }

    const post = await feedService.createFeed(userId, {
        companyId,
        caption: postData.caption,
        media: postData.media || [],
        status: postData.status || 'published',
    });

    // Increment post count for the company
    await Company.updateOne({ _id: companyId }, { $inc: { postCount: 1 } });

    return post;
};

const getCompanyFeeds = async (companyId) => {
    const posts = await feedService.findFeedById(companyId).sort({ createdAt: -1 });
    return posts;
};

const getCompanies = async ({ userId, search, page, limit, mine }) => {
    if (!userId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'UserId is required');
    }

    const userIdObj = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

    const baseMyCompaniesQuery = {
        $or: [{ owner: userIdObj }, { admins: userIdObj }],
    };

    const baseDiscoverCompaniesQuery = {
        $and: [{ owner: { $ne: userIdObj } }, { admins: { $nin: [userIdObj] } }],
    };

    const myCompaniesQuery = search
        ? {
              $and: [baseMyCompaniesQuery, { name: { $regex: search, $options: 'i' } }],
          }
        : baseMyCompaniesQuery;

    const discoverCompaniesQuery = search
        ? {
              $and: [baseDiscoverCompaniesQuery, { name: { $regex: search, $options: 'i' } }],
          }
        : baseDiscoverCompaniesQuery;

    const myCompanies = await Company.find(myCompaniesQuery)
        .select(
            'name tagline about profilePicture coverImage size websiteUrl industry jobCount postCount memberCount location country city state zipcode verificationStatus status admins owner createdAt updatedAt',
        )
        .sort({ createdAt: -1 })
        .lean();

    const discoverCompanies = await Company.find(discoverCompaniesQuery)
        .select(
            'name tagline about profilePicture coverImage size websiteUrl industry jobCount postCount memberCount location country city state zipcode verificationStatus status admins owner createdAt updatedAt',
        )
        .sort({ createdAt: -1 })
        .lean();

    const allCompanyIds = [...myCompanies.map((c) => c._id), ...discoverCompanies.map((c) => c._id)];

    const postCounts = await Feed.aggregate([
        {
            $match: {
                companyId: { $in: allCompanyIds },
                status: 'published',
            },
        },
        {
            $group: {
                _id: '$companyId',
                count: { $sum: 1 },
            },
        },
    ]);

    const jobCounts = await Job.aggregate([
        {
            $match: {
                companyId: { $in: allCompanyIds },
                isActive: true,
            },
        },
        {
            $group: {
                _id: '$companyId',
                count: { $sum: 1 },
            },
        },
    ]);

    const postCountMap = {};
    postCounts.forEach((item) => {
        postCountMap[item._id.toString()] = item.count;
    });

    const jobCountMap = {};
    jobCounts.forEach((item) => {
        jobCountMap[item._id.toString()] = item.count;
    });

    const myCompanyIds = new Set(myCompanies.map((c) => c._id.toString()));

    const myCompaniesWithCounts = myCompanies.map((company) => {
        const companyIdStr = company._id.toString();
        return {
            ...company,
            jobCount: jobCountMap[companyIdStr] || company.jobCount || 0,
            postCount: postCountMap[companyIdStr] || company.postCount || 0,
            memberCount: company.memberCount || (company.admins ? company.admins.length : 0),
        };
    });

    const discoverCompaniesFiltered = discoverCompanies.filter((company) => !myCompanyIds.has(company._id.toString()));

    const discoverCompaniesWithCounts = discoverCompaniesFiltered.map((company) => {
        const companyIdStr = company._id.toString();
        return {
            ...company,
            jobCount: jobCountMap[companyIdStr] || company.jobCount || 0,
            postCount: postCountMap[companyIdStr] || company.postCount || 0,
            memberCount: company.memberCount || (company.admins ? company.admins.length : 0),
        };
    });

    return {
        companies: mine
            ? [
                  ...myCompaniesWithCounts,
                  {
                      total: myCompaniesWithCounts.length,
                      page: Number(page),
                      limit: Number(limit),
                      totalPages: Math.ceil(myCompaniesWithCounts.length / limit),
                  },
              ]
            : [
                  ...discoverCompaniesWithCounts,
                  {
                      total: discoverCompaniesWithCounts.length,
                      page: Number(page),
                      limit: Number(limit),
                      totalPages: Math.ceil(discoverCompaniesWithCounts.length / limit),
                  },
              ],
    };
};

/**
 * Export all companies to Excel format
 * @returns {Promise<Buffer>} Excel file buffer
 */
const exportCompaniesToExcel = async () => {
    // Get all companies with their admins populated
    const companies = await Company.find({}).populate('admins', 'firstName lastName email').lean();

    // Prepare data for Excel
    const excelData = companies.map((company) => {
        const admins = company.admins || [];
        const adminNames = admins.map((admin) => `${admin.firstName} ${admin.lastName}`).join(', ');
        const adminEmails = admins.map((admin) => admin.email).join(', ');

        return {
            'Company ID': company._id.toString(),
            'Company Name': company.name || '',
            Tagline: company.tagline || '',
            About: company.about || '',
            Industry: company.industry || '',
            'Company Size': company.size || '',
            Location: company.location || '',
            Country: company.country || '',
            State: company.state || '',
            City: company.city || '',
            Zipcode: company.zipcode || '',
            'Website URL': company.websiteUrl || '',
            'Job Count': company.jobCount || 0,
            'Verification Status': company.verificationStatus || '',
            Status: company.status || '',
            'Profile Picture': company.profilePicture || '',
            'Cover Image': company.coverImage || '',
            'Admin Names': adminNames,
            'Admin Emails': adminEmails,
            'Admin Count': admins.length,
            'Created At': company.createdAt ? new Date(company.createdAt).toLocaleString() : '',
            'Updated At': company.updatedAt ? new Date(company.updatedAt).toLocaleString() : '',
        };
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const columnWidths = [
        { wch: 25 }, // Company ID
        { wch: 30 }, // Company Name
        { wch: 40 }, // Tagline
        { wch: 50 }, // About
        { wch: 20 }, // Industry
        { wch: 15 }, // Company Size
        { wch: 30 }, // Location
        { wch: 15 }, // Country
        { wch: 15 }, // State
        { wch: 15 }, // City
        { wch: 10 }, // Zipcode
        { wch: 40 }, // Website URL
        { wch: 10 }, // Job Count
        { wch: 15 }, // Verification Status
        { wch: 10 }, // Status
        { wch: 50 }, // Profile Picture
        { wch: 50 }, // Cover Image
        { wch: 50 }, // Admin Names
        { wch: 50 }, // Admin Emails
        { wch: 12 }, // Admin Count
        { wch: 20 }, // Created At
        { wch: 20 }, // Updated At
    ];

    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Companies');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return excelBuffer;
};

/**
 * Update company by id
 * @param {ObjectId} companyId
 * @param {Object} updateBody
 * @returns {Promise<Company>}
 */
const updateCompanyById = async (companyId, updateBody) => {
    const company = await Company.findById(companyId);
    if (!company) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
    }

    // Check if name is being updated and if it's already taken
    if (updateBody.name && updateBody.name !== company.name) {
        const existingCompany = await Company.findOne({ name: updateBody.name });
        if (existingCompany) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Company name already exists');
        }
    }

    Object.assign(company, updateBody);
    await company.save();
    return company;
};

module.exports = {
    createCompany,
    getCompanyDetails,
    postCompanyFeed,
    getCompanyFeeds,
    getCompanies,
    exportCompaniesToExcel,
    updateCompanyById,
};
