const httpStatus = require('http-status');
const { highlightService } = require('../services');
const catchAsync = require('../utils/catchAsync');

const createHighlight = catchAsync(async (req, res) => {
    const highlight = await highlightService.createHighlight(req.user.id, req.body);
    res.status(httpStatus.CREATED).send({ highlight });
});

const getHighlights = catchAsync(async (req, res) => {
    const { userId } = req.query;
    const highlights = await highlightService.getUserHighlights(userId || req.user.id);
    res.status(httpStatus.OK).send({ highlights });
});

const updateHighlight = catchAsync(async (req, res) => {
    const highlight = await highlightService.updateHighlight(req.params.highlightId, req.user.id, req.body);
    res.status(httpStatus.OK).send({ highlight });
});

const deleteHighlight = catchAsync(async (req, res) => {
    await highlightService.deleteHighlight(req.params.highlightId);
    res.status(httpStatus.OK).send();
});

module.exports = {
    createHighlight,
    getHighlights,
    deleteHighlight,
    updateHighlight,
};
