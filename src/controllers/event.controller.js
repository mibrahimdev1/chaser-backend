const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { eventService } = require('../services');

const get = catchAsync(async (req, res) => {
    const options = pick({ ...req.query, populate: 'attendees,organizedBy,interested' }, ['limit', 'page', 'populate']);
    const result = await eventService.queryEvent({}, options);
    res.send(result);
});
const add = catchAsync(async (req, res) => {
    const event = await eventService.createEvent(req.body);
    res.status(httpStatus.CREATED).send(event);
});

const update = catchAsync(async (req, res) => {
    const event = await eventService.updateEventById(req.params.eventId, req.body);
    res.send(event);
});

const remove = catchAsync(async (req, res) => {
    await eventService.deleteEventById(req.params.eventId);
    res.status(httpStatus.NO_CONTENT).send();
});
const getEvent = catchAsync(async (req, res) => {
    const event = await eventService.getEventById(req.params.eventId);
    res.send(event);
});

const interested = catchAsync(async (req, res) => {
    const { eventId } = req.params;
    const result = await eventService.addAsInterested(eventId, req.user.id);
    res.send(result);
});
const notInterested = catchAsync(async (req, res) => {
    const { eventId } = req.params;
    const result = await eventService.addAsNotInterested(eventId, req.user.id);
    res.send(result);
});

const updateIntent = (req, res, next) => {
    const { action } = req.body;
    switch (action) {
        case 'interested':
            return interested(req, res, next);
        case 'notInterested':
            return notInterested(req, res, next);
        default:
            return notInterested(req, res, next);
    }
};

const shareOnFeed = catchAsync(async (req, res) => {
    const { eventId } = req.params;
    const result = await eventService.shareOnFeed(eventId, req.user.id, req.body);
    res.status(httpStatus.OK).send({ feed: result });
});
module.exports = {
    add,
    update,
    get,
    remove,
    getEvent,
    updateIntent,
    shareOnFeed,
};
