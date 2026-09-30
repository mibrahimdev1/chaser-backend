const httpStatus = require('http-status');
const { Event } = require('../models');
const ApiError = require('../utils/ApiError');
const { feedService } = require('.');

/**
 * Create an event
 * @param {Object} eventBody
 * @returns {Promise<Event>}
 */
const createEvent = async (eventBody) => {
    return Event.create(eventBody);
};

/**
 * Query for events
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryEvent = async (filter, options) => {
    // Sort by createdAt in descending order (latest first) if sortBy is not already specified
    const paginateOptions = {
        ...options,
        sortBy: options.sortBy || 'createdAt:desc',
    };

    let populateOptions = paginateOptions.populate || '';
    if (populateOptions) {
        const populateFields = populateOptions.split(',');
        const userFields = ['organizedBy', 'attendees', 'interested', 'notInterested'];
        const fieldsToAdd = [];

        populateFields.forEach((field) => {
            if (userFields.includes(field)) {
                fieldsToAdd.push(`${field}.userProfile`);
            }
        });

        if (fieldsToAdd.length > 0) {
            populateOptions = `${populateOptions},${fieldsToAdd.join(',')}`;
        }
    }

    paginateOptions.populate = populateOptions;

    const result = await Event.paginate(filter, paginateOptions);

    if (result.results && Array.isArray(result.results)) {
        result.results.forEach((event) => {
            if (event.organizedBy && event.organizedBy.userProfile) {
                event.organizedBy.username = event.organizedBy.userProfile.username;
                delete event.organizedBy.userProfile;
            }
            if (event.attendees && Array.isArray(event.attendees)) {
                event.attendees.forEach((attendee) => {
                    if (attendee && attendee.userProfile) {
                        attendee.username = attendee.userProfile.username;
                        delete attendee.userProfile;
                    }
                });
            }
            if (event.interested && Array.isArray(event.interested)) {
                event.interested.forEach((user) => {
                    if (user && user.userProfile) {
                        user.username = user.userProfile.username;
                        delete user.userProfile;
                    }
                });
            }
            if (event.notInterested && Array.isArray(event.notInterested)) {
                event.notInterested.forEach((user) => {
                    if (user && user.userProfile) {
                        user.username = user.userProfile.username;
                        delete user.userProfile;
                    }
                });
            }
        });
    }

    return result;
};

/**
 * Get event by id
 * @param {ObjectId} id
 * @returns {Promise<Event>}
 */
const getEventById = async (id) => {
    const event = await Event.findById(id)
        .populate({
            path: 'organizedBy',
            select: 'firstName lastName email profilePicture displayName',
            populate: {
                path: 'userProfile',
                select: 'username',
            },
        })
        .populate({
            path: 'attendees',
            select: 'firstName lastName email profilePicture displayName',
            populate: {
                path: 'userProfile',
                select: 'username',
            },
        })
        .populate({
            path: 'interested',
            select: 'firstName lastName email profilePicture displayName',
            populate: {
                path: 'userProfile',
                select: 'username',
            },
        })
        .populate({
            path: 'notInterested',
            select: 'firstName lastName email profilePicture displayName',
            populate: {
                path: 'userProfile',
                select: 'username',
            },
        })
        .lean();

    if (event) {
        if (event.organizedBy && event.organizedBy.userProfile) {
            event.organizedBy.username = event.organizedBy.userProfile.username;
            delete event.organizedBy.userProfile;
        }
        if (event.attendees && Array.isArray(event.attendees)) {
            event.attendees.forEach((attendee) => {
                if (attendee && attendee.userProfile) {
                    attendee.username = attendee.userProfile.username;
                    delete attendee.userProfile;
                }
            });
        }
        if (event.interested && Array.isArray(event.interested)) {
            event.interested.forEach((user) => {
                if (user && user.userProfile) {
                    user.username = user.userProfile.username;
                    delete user.userProfile;
                }
            });
        }
        if (event.notInterested && Array.isArray(event.notInterested)) {
            event.notInterested.forEach((user) => {
                if (user && user.userProfile) {
                    user.username = user.userProfile.username;
                    delete user.userProfile;
                }
            });
        }
    }

    return event;
};

/**
 * Update Event by id
 * @param {ObjectId} eventId
 * @param {Object} updateBody
 * @returns {Promise<Event>}
 */
const updateEventById = async (eventId, updateBody) => {
    const event = await getEventById(eventId);
    if (!event) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
    }
    Object.assign(event, updateBody);
    await event.save();
    return event;
};

/**
 * Delete event by id
 * @param {ObjectId} eventId
 * @returns {Promise<Event>}
 */
const deleteEventById = async (eventId) => {
    const event = await getEventById(eventId);
    if (!event) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
    }
    await event.remove();
    return event;
};

const addAsInterested = async (id, userId) => {
    const event = await Event.findOne({ _id: id });
    if (!event) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
    }
    if (event.notInterested.includes(userId)) {
        event.notInterested.pull(userId);
    }
    if (!event.interested.includes(userId)) {
        event.interested.push(userId);
        await event.save();
    }
    return event;
};
const addAsNotInterested = async (id, userId) => {
    const event = await Event.findOne({ _id: id });
    if (!event) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
    }
    if (event.interested.includes(userId)) {
        event.interested.pull(userId);
    }
    if (!event.notInterested.includes(userId)) {
        event.notInterested.push(userId);
        await event.save();
    }
    return event;
};

const shareOnFeed = async (eventId, userId, body) => {
    const event = await getEventById(eventId);
    if (!event) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
    }
    const feedBody = {
        postType: 'event',
        groupId: body.groupId || null,
        companyId: body.companyId || null,
        meta: {
            ...event,
        },
    };
    const feed = await feedService.createFeed(userId, feedBody);
    return feed;
};
module.exports = {
    createEvent,
    queryEvent,
    getEventById,
    updateEventById,
    deleteEventById,
    addAsInterested,
    addAsNotInterested,
    shareOnFeed,
};
