const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const CompanySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        tagline: { type: String, trim: true },
        about: { type: String, trim: true },
        profilePicture: { type: String },
        coverImage: { type: String },
        size: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'] },
        websiteUrl: { type: String, trim: true },
        industry: { type: String, required: true, trim: true },
        jobCount: { type: Number, default: 0 },
        postCount: { type: Number, default: 0 },
        memberCount: { type: Number, default: 0 },
        location: { type: String, required: true, trim: true },
        country: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        zipcode: {
            type: String,
            trim: true,
        },
        verificationStatus: {
            type: String,
            enum: ['pending', 'verified'],
            default: 'pending',
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Company owner
        admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Page managers
    },
    { timestamps: true },
);

CompanySchema.plugin(toJSON);

module.exports = mongoose.model('Company', CompanySchema);
