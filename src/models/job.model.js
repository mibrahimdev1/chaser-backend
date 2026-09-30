const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const JobSchema = new mongoose.Schema(
    {
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        location: { type: String, trim: true },
        jobType: {
            type: String,
            enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Other', 'Volunteer', 'Internship'],
        },
        industry: { type: String },
        workType: { type: String, enum: ['Remote', 'Hybrid', 'Onsite'] },
        experienceLevel: { type: String, enum: ['Internship', 'Entry', 'Mid', 'Senior', 'Director'] },
        skillsRequired: [{ type: String }],
        salary: {
            min: { type: Number },
            max: { type: Number },
            currency: { type: String, default: 'USD' },
            payType: { type: String, enum: ['Hourly', 'Monthly', 'Yearly'], required: true },
        },

        applicants: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                name: { type: String, required: true },
                email: { type: String, required: true },
                phone: { type: String },
                resume: { type: String }, // PDF URL
                about: { type: String, trim: true },
                status: { type: String, enum: ['not_applied', 'pending', 'approve', 'reject'], default: 'pending' },
                appliedAt: { type: Date, default: Date.now },
            },
        ],

        tags: [{ type: String }],
        isFeatured: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        expiresAt: { type: Date },
    },
    { timestamps: true },
);

JobSchema.plugin(toJSON);
JobSchema.plugin(paginate);

const Job = mongoose.model('Job', JobSchema);

module.exports = Job;
