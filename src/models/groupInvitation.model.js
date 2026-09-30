const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const groupInvitationSchema = new mongoose.Schema(
    {
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
            required: true,
        },
        inviter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        invitee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'cancelled'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    },
);

// Add plugins
groupInvitationSchema.plugin(toJSON);
groupInvitationSchema.plugin(paginate);

// Indexes
// Compound index to prevent duplicate pending invitations
groupInvitationSchema.index({ group: 1, invitee: 1, status: 1 });
// Index for quick lookup of user's invitations
groupInvitationSchema.index({ invitee: 1 });
// Index for group-specific queries
groupInvitationSchema.index({ group: 1 });
// Index for inviter queries
groupInvitationSchema.index({ inviter: 1 });

const GroupInvitation = mongoose.model('GroupInvitation', groupInvitationSchema);

module.exports = GroupInvitation;
