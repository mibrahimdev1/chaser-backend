const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const experienceSchema = mongoose.Schema({
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    employmentType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Other'],
    },
    location: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date }, // Can be null for ongoing jobs
    description: { type: String, trim: true },
});

const educationSchema = mongoose.Schema({
    institution: { type: String, required: true, trim: true },
    degree: { type: String, trim: true },
    fieldOfStudy: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String, trim: true },
});

const skillSchema = mongoose.Schema({
    name: { type: String, required: true, trim: true },
    endorsedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Optional endorsements
});

const awardSchema = mongoose.Schema({
    title: { type: String, required: true, trim: true },
    issuer: { type: String, trim: true },
    dateReceived: { type: Date },
    description: { type: String, trim: true },
});

const userProfileSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        coverImage: {
            type: String,
        },
        username: {
            type: String,
            unique: true,
            trim: true,
            lowercase: true,
        },
        gender: {
            type: String,
        },
        bio: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        country: {
            type: String,
            trim: true,
        },
        state: {
            type: String,
            trim: true,
        },
        city: {
            type: String,
            trim: true,
        },
        zipcode: {
            type: String,
            trim: true,
        },
        chasingCategory: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        experiences: [experienceSchema],
        education: [educationSchema],
        interests: [{ type: String, trim: true }],
        skills: [skillSchema],
        awards: [awardSchema],
        savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
    },
    {
        timestamps: true,
    },
);
userProfileSchema.plugin(toJSON);

const userProfile = mongoose.model('userProfile', userProfileSchema);

module.exports = userProfile;
