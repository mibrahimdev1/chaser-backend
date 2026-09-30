const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const eventSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        time: {
            type: String,
            required: true,
        },
        endDate: {
            type: Date,
        },
        endTime: {
            type: String,
        },
        location: {
            type: String,
            // required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        eventType: {
            type: String,
            enum: ['online', 'inperson'],
            required: true,
            default: 'inperson',
        },
        description: {
            type: String,
        },
        eventUrl: {
            type: String,
            default: null,
        },
        attendees: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        organizedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        interested: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        notInterested: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        imageUrl: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

eventSchema.plugin(toJSON);
eventSchema.plugin(paginate);

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
