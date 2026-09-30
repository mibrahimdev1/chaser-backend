const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const contentSchema = mongoose.Schema({
    content: {
        type: Object,
        required: true,
    },
    content_type: {
        type: String,
        enum: ['aboutus', 'privacypolicy', 'communityguidelines', 'termsofservice', 'cookiepolicy', 'useragreement'],
        required: true,
    },
});

contentSchema.plugin(toJSON);

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;
