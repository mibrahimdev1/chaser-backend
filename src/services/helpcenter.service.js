const { HelpCenter, ContactForm } = require('../models');

const createHelpRequest = async (userId, subject, message) => {
    try {
        const helpRequest = new HelpCenter({
            userId,
            subject,
            message,
        });

        const savedRequest = await helpRequest.save();
        return savedRequest;
    } catch (error) {
        throw new Error(`Error creating help request: ${error.message}`);
    }
};

const createContactForm = async ({ name, email, message }) => {
    const newContact = new ContactForm({
        name,
        email,
        message,
    });
    return await newContact.save();
};

const getHelpRequests = async () => {
    try {
        const helpRequests = await HelpCenter.find()
            .populate({
                path: 'userId',
                select: 'firstName lastName displayName email',
            })
            .populate({
                path: 'user.userProfile',
                select: 'username',
            });

        helpRequests.forEach((request) => {
            if (request.user && request.user.userProfile) {
                request.user.username = request.user.userProfile.username;
                delete request.user.userProfile;
            }
        });

        return helpRequests;
    } catch (error) {
        throw new Error(`Error fetching help requests: ${error.message}`);
    }
};

module.exports = {
    createHelpRequest,
    getHelpRequests,
    createContactForm,
};
