const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mediaUrl: { type: String, required: true }, // URL for image/video
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    textContent: { type: String }, // Optional for text stories
    views: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who viewed the story
    isExpired: { type: Boolean, default: false }, // Flag to indicate expiration
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Story', StorySchema);
