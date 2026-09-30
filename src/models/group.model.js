const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins'); // Assuming you have these plugins

const GroupSchema = new mongoose.Schema(
    {
        profilePicture: {
            type: String,
            trim: true,
            default: '',
        },
        coverPicture: {
            type: String,
            trim: true,
            default: '',
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        industry: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        location: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        rules: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        groupType: {
            type: String,
            enum: ['public', 'private'],
            default: 'public',
        },
        permissions: {
            allowMemberInvites: {
                type: Boolean,
                default: true,
            },
            requirePostApproval: {
                type: Boolean,
                default: false,
            },
        },
        admins: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
        ],
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        memberCount: {
            type: Number,
            default: 0,
        },
        postCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    },
);

GroupSchema.plugin(toJSON);
GroupSchema.plugin(paginate);

GroupSchema.index({ name: 'text', description: 'text' });
GroupSchema.index({ industry: 1 });
GroupSchema.index({ location: 1 });
GroupSchema.index({ groupType: 1 });
GroupSchema.index({ memberCount: -1 }); // Sort by most popular groups
GroupSchema.index({ postCount: -1 }); // Sort by most active groups

GroupSchema.statics.incrementMemberCount = async function (groupId) {
    await this.findByIdAndUpdate(groupId, { $inc: { memberCount: 1 } });
};

GroupSchema.statics.incrementPostCount = async function (groupId) {
    await this.findByIdAndUpdate(groupId, { $inc: { postCount: 1 } });
};

const Group = mongoose.model('Group', GroupSchema);

module.exports = Group;
