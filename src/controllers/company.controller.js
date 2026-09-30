const httpStatus = require('http-status');
const { companyService } = require('../services');
const catchAsync = require('../utils/catchAsync');

const createCompany = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const companyData = req.body;

    const company = await companyService.createCompany(userId, companyData);
    res.status(httpStatus.OK).send({ company });
});

const getCompanyDetails = catchAsync(async (req, res) => {
    const { companyId } = req.params;
    const company = await companyService.getCompanyDetails(companyId);
    res.status(httpStatus.OK).send({ company });
});

const postCompanyFeed = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { companyId } = req.params;
    const postData = req.body;

    const post = await companyService.postCompanyFeed(userId, companyId, postData);
    res.status(httpStatus.CREATED).send({ message: 'Post created successfully', post });
});

const getCompanyFeeds = catchAsync(async (req, res) => {
    const { companyId } = req.params;
    const posts = await companyService.getCompanyFeeds(companyId);
    res.status(httpStatus.OK).send({ posts });
});

const getCompanies = catchAsync(async (req, res) => {
    const { search, page = 1, limit = 10, mine } = req.query;
    const userId = req.user.id;

    const mineBoolean = mine === 'true' || mine === true;

    const companyQuery = {
        userId,
        search,
        page,
        limit,
        mine: mineBoolean,
    };

    const companies = await companyService.getCompanies(companyQuery);

    res.status(httpStatus.OK).send(companies);
});

const exportCompanies = catchAsync(async (req, res) => {
    const excelBuffer = await companyService.exportCompaniesToExcel();

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=companies_export.xlsx');
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the Excel file
    res.send(excelBuffer);
});

const getCompanyMedia = catchAsync(async (req, res) => {
    const { companyId } = req.params;
    const { feedService } = require('../services');

    const mediaPosts = await feedService.getMediaPostsByCompany(companyId);

    const result = mediaPosts.map((post) => ({
        _id: post._id,
        media: post.media || post.files || [],
    }));

    return res.status(httpStatus.OK).send({ posts: result });
});

const updateCompany = catchAsync(async (req, res) => {
    const { companyId } = req.params;
    const company = await companyService.updateCompanyById(companyId, req.body);
    res.status(httpStatus.OK).send({ company });
});

module.exports = {
    createCompany,
    getCompanyDetails,
    postCompanyFeed,
    getCompanyFeeds,
    getCompanies,
    exportCompanies,
    getCompanyMedia,
    updateCompany,
};
