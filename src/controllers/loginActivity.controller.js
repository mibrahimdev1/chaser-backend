const httpStatus = require('http-status');
const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');
const LoginActivity = require('../models/loginActivity.model');

const getLoginActivities = catchAsync(async (req, res) => {
    const { userId } = req.query;
    const filter = userId ? { userId: mongoose.Types.ObjectId(userId) } : {};
    const options = pick(req.query, ['page', 'limit', 'sortBy']);
    // Set default limit to 10 if not provided
    if (!options.limit) {
        options.limit = 10;
    }
    // Set default page to 1 if not provided
    if (!options.page) {
        options.page = 1;
    }
    // Sort by createdAt descending (latest first) by default
    if (!options.sortBy) {
        options.sortBy = 'createdAt:desc';
    }
    const result = await LoginActivity.paginate(filter, options);
    res.status(httpStatus.OK).send(result);
});
module.exports = { getLoginActivities };
