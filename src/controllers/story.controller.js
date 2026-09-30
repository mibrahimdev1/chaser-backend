const httpStatus = require('http-status');
const { storyService } = require('../services');
const catchAsync = require('../utils/catchAsync');

const createStory = catchAsync(async (req, res) => {
    const story = await storyService.createStory({ userId: req.user.id, ...req.body });
    res.status(httpStatus.OK).json({ story });
});

const getStories = catchAsync(async (req, res) => {
    const { userId } = req.query;
    const stories = await storyService.getUserStories(userId);
    res.status(httpStatus.OK).send({ stories });
});

const getExpiredStories = catchAsync(async (req, res) => {
    const expiredStories = await storyService.getExpiredStories(req.params.userId);
    res.status(httpStatus.OK).send({ stories: expiredStories });
});

const getFollowedUsersStories = catchAsync(async (req, res) => {
    const stories = await storyService.getFollowedUsersStories(req.user.id);
    res.status(httpStatus.OK).send({ stories });
});

const deleteStory = catchAsync(async (req, res) => {
    await storyService.deleteStory(req.params.storyId);
    res.status(httpStatus.OK).send();
});

const getStory = catchAsync(async (req, res) => {
    const story = await storyService.getStory(req.params.storyId);
    res.status(httpStatus.OK).send({ story });
});

module.exports = {
    createStory,
    getStories,
    getExpiredStories,
    deleteStory,
    getStory,
    getFollowedUsersStories,
};
