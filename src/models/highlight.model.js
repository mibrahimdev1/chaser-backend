const mongoose = require('mongoose');

const HighlightSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    coverImage: { type: String, required: true },
    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Story' }],
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Highlight', HighlightSchema);
