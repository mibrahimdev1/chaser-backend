const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { Content } = require('../models');

const addContent = catchAsync(async (req, res) => {
    const { content_type } = req.body;
    const exists = await Content.exists({ content_type });
    if (exists) {
        res.status(httpStatus.CONFLICT).send({
            message: 'Content already exists with this content type',
        });
        return;
    }
    const content = await Content.create({ ...req.body });
    res.status(httpStatus.CREATED).send({ content });
});

const updateContent = catchAsync(async (req, res) => {
    const { content, content_type } = req.body;
    const dbcontent = await Content.findOne({ content_type });
    if (!dbcontent) {
        // eslint-disable-next-line no-shadow
        const content = await Content.create({ ...req.body });
        res.status(httpStatus.CREATED).send({ content });
        return;
    }
    dbcontent.set({ content });
    await dbcontent.save();

    res.status(httpStatus.NO_CONTENT).send();
});

const getContent = catchAsync(async (req, res) => {
    const { content_type } = req.query;
    const content = await Content.find({ content_type });
    if (content) {
        res.status(httpStatus.OK).send({ content });
    } else {
        res.status(httpStatus.NOT_FOUND).send({ message: 'No content found' });
    }
});
module.exports = {
    addContent,
    getContent,
    updateContent,
};
