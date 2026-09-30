const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync'); // Utility to handle async errors
const { helpCenterService } = require('../services');

const createHelpRequest = catchAsync(async (req, res) => {
    const { subject, message } = req.body; // Extract data from the request body
    const userId = req.user.id; // Assume `req.user` is populated by authentication middleware

    const helpRequest = await helpCenterService.createHelpRequest(userId, subject, message);

    return res.status(httpStatus.CREATED).json({
        message: 'Help request created successfully',
        helpRequest,
    });
});

const createContactForm = catchAsync(async (req, res) => {
    await helpCenterService.createContactForm(req.body);
    return res.status(httpStatus.CREATED).json({
        message: 'Form submitted successfully',
    });
});
const listHelpRequests = catchAsync(async (req, res) => {
    const helpRequests = await helpCenterService.getHelpRequests();

    return res.status(httpStatus.OK).json({
        message: 'Help requests fetched successfully',
        helpRequests,
    });
});

module.exports = {
    createHelpRequest,
    listHelpRequests,
    createContactForm,
};
