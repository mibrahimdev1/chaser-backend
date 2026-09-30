const { Report } = require('../models');

const getReports = async (filter) => {
    const { populate, ...query } = filter;

    let reportsQuery = Report.find(query).lean();

    if (populate && Array.isArray(populate)) {
        populate.forEach((field) => {
            reportsQuery = reportsQuery.populate(field).lean();
        });
    }

    return await reportsQuery.exec();
};

const queryReports = async (filter, options) => {
    const reports = await Report.paginate(filter, options);
    return reports;
};

const reportPost = async (body) => {
    await Report.create(body);
};

const getReportById = async (reportId) => {
    const report = await Report.findById(reportId).populate('reportedBy reportedTo').lean();
    return report;
};
module.exports = {
    getReports,
    reportPost,
    queryReports,
    getReportById,
};
