const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
    {
        postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Feed', required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        likeCount: { type: Number, default: 0 },
        replyCount: { type: Number, default: 0 },
        taggedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        taggedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
        taggedCompanies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],
        parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // Added parentId for nested comments
    },
    { timestamps: true },
);

// Indexes for faster lookups
CommentSchema.index({ postId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', CommentSchema);
