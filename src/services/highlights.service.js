const httpStatus = require('http-status');
const Highlight = require('../models/highlight.model');
const Story = require('../models/story.model');
const ApiError = require('../utils/ApiError');

const createHighlight = async (userId, data) => {
    // Check if stories exist
    const storiesExist = await Story.find({ _id: { $in: data.stories }, userId });
    if (storiesExist.length !== data.stories.length) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Some stories do not exist or belong to another user.');
    }

    // Create highlight
    const highlight = await Highlight.create({
        userId,
        title: data.title,
        coverImage: data.coverImage,
        stories: data.stories,
    });

    return highlight;
};

const getUserHighlights = async (userId) => {
    return Highlight.find({ userId }).populate('stories');
};

const deleteHighlight = async (highlightId) => {
    const highlight = await Highlight.findById(highlightId);
    if (!highlight) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Highlight not found.');
    }

    await highlight.deleteOne();
};

const updateHighlight = async (highlightId, userId, data) => {
    const highlight = await Highlight.findById(highlightId);

    if (!highlight) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Highlight not found.');
    }

    if (highlight.userId.toString() !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to edit this highlight.');
    }

    // Validate stories exist and belong to the user
    if (data.stories) {
        const validStories = await Story.find({ _id: { $in: data.stories }, userId });
        if (validStories.length !== data.stories.length) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Some stories do not exist or belong to another user.');
        }
        highlight.stories = data.stories;
    }

    if (data.title) highlight.title = data.title;
    if (data.coverImage) highlight.coverImage = data.coverImage;

    await highlight.save();
    return highlight;
};

module.exports = {
    createHighlight,
    getUserHighlights,
    updateHighlight,
    deleteHighlight,
};
