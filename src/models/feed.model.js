const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const FeedSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
        groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
        isReel: {
            type: Boolean,
            default: false,
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
        taggedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        taggedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
        taggedCompanies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],
        postType: {
            type: String,
            enum: ['sharedPost', 'poll', 'celebrate', 'default', 'document', 'video', 'job', 'event', 'media'],
        },
        caption: { type: String, trim: true },
        media: [
            {
                url: { type: String, required: true },
                type: { type: String, enum: ['image', 'video', 'gif', 'document'], required: true },
                name: String,
            },
        ],
        poll: {
            question: { type: String, trim: true },
            options: [{ type: String, trim: true }],
            votes: [{ userId: mongoose.Schema.Types.ObjectId, selectedOption: String }],
        },
        status: {
            type: String,
            default: 'published',
            enum: ['published', 'scheduled', 'draft', 'suspended'],
        },
        scheduledAt: { type: Date }, // If set, post will be published at this time
        likes: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                type: {
                    type: String,
                    enum: ['like', 'dislike', 'sad', 'angry', 'happy', 'celebrate'],
                    default: 'like',
                },
            },
        ],
        shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        sharedPost: {
            originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Feed' },
            caption: { type: String, trim: true },
        },
        likeCount: { type: Number, default: 0 },
        shareCount: { type: Number, default: 0 },
        commentCount: { type: Number, default: 0 },
        meta: {
            type: Object,
        },
    },
    { timestamps: true },
);

FeedSchema.plugin(toJSON);
FeedSchema.plugin(paginate);

// indexes

FeedSchema.index({ caption: 'text', 'comments.text': 'text', 'media.description': 'text' }); // Full-text search
FeedSchema.index({ createdAt: -1 });
FeedSchema.index({ userId: 1, createdAt: -1 });
FeedSchema.index({ postType: 1, createdAt: -1 });
FeedSchema.index({ scheduledAt: 1 });
FeedSchema.index({ likeCount: -1, shareCount: -1 });
FeedSchema.index({ 'sharedPost.originalPost': 1 });
FeedSchema.index({ postId: 1, 'comments.createdAt': -1 });
FeedSchema.index({ isPublic: 1, createdAt: -1 }); // Index for public posts

module.exports = mongoose.model('Feed', FeedSchema);
