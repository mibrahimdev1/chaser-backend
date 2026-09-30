const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const reportSchema = mongoose.Schema(
    {
        reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        reportedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
        postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Feed' },
        commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
        content: { type: String, required: true },
        type: {
            type: String,
            enum: ['user', 'huddle', 'chat', 'post', 'comment'],
            required: true,
        },
        reportType: { type: String, required: true },
    },
    {
        timestamps: true,
    },
);

reportSchema.plugin(toJSON);
reportSchema.plugin(paginate);

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
