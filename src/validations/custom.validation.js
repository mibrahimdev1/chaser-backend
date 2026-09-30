const mongoose = require('mongoose');

const contentType = (value, helpers) => {
    const enums = [
        'aboutus',
        'privacypolicy',
        'communityguidelines',
        'termsofservice',
        'cookiepolicy',
        'useragreement',
    ];
    if (enums.includes(value)) {
        return value;
    }
    return helpers.message('content type is invalid');
};
const objectId = (value, helpers) => {
    if (!value.match(/^[0-9a-fA-F]{24}$/)) {
        return helpers.message('"{{#label}}" must be a valid mongo id');
    }
    return value;
};

const password = (value, helpers) => {
    if (value.length < 8) {
        return helpers.message('password must be at least 8 characters');
    }
    if (!value.match(/[a-zA-Z]/)) {
        return helpers.message('password must contain at least 1 letter');
    }
    if (!value.match(/[0-9]/)) {
        return helpers.message('password must contain at least 1 number');
    }
    if (!value.match(/[!@#$%^&*(),.?":{}|<>\-_]/)) {
        return helpers.message('password must contain at least 1 special character');
    }
    return value;
};

const chatContentType = (value, helpers) => {
    const enums = ['text', 'media', 'voicenote'];
    if (enums.includes(value)) {
        return value;
    }
    return helpers.message('content type is invalid');
};

const mongooseIdType = (value, helpers) => {
    if (typeof value === 'object') {
        const allValidObjectIds = value.every((id) => mongoose.Types.ObjectId.isValid(id));
        if (!allValidObjectIds) {
            return helpers.message('one of the ID in the array is not Object ID');
        }
        return value;
    }
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message(`${value} is not a valid Object ID`);
    }
    return value;
};

module.exports = {
    objectId,
    password,
    chatContentType,
    mongooseIdType,
    contentType,
};
