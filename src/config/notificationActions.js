// Define constants for actions
const ACTIONS = {
    POST_LIKE: 'POST_LIKE',
    POST_ADD: 'POST_ADD',
    POST_COMMENT: 'POST_COMMENT',
    POST_SHARE: 'POST_SHARE',
    FOLLOW_REQUEST: 'FOLLOW_REQUEST',
    FOLLOW_ACCEPTED: 'FOLLOW_ACCEPTED',
    POST_RESHARE: 'POST_RESHARE',
    MESSAGE: 'MESSAGE',
    GROUP_POST: 'GROUP_POST',
    JOB_SUGGEST: 'JOB_SUGGEST',
    GROUP_ADDED: 'GROUP_ADDED',
    POLL_RESULT: 'POLL_RESULT',
    EVENT_SUGGEST: 'EVENT_SUGGEST',
    POST_MENTION: 'POST_MENTION',
    COMMENT_MENTION: 'COMMENT_MENTION',
    VERIFICATION_REJECTED: 'VERIFICATION_REJECTED',
    GROUP_INVITE: 'GROUP_INVITE',
    GROUP_INVITE_ACCEPTED: 'GROUP_INVITE_ACCEPTED',
    GROUP_INVITE_REJECTED: 'GROUP_INVITE_REJECTED',
};

// Function to generate detailed notification body based on action and relevant fields
const generateNotificationBody = (action, fields) => {
    switch (action) {
        case ACTIONS.POST_LIKE:
        case ACTIONS.POST_ADD:
        case ACTIONS.POST_COMMENT:
            return `${fields.post}`;

        case ACTIONS.POST_SHARE:
            return `${fields.userName} shared your post: "${fields.postTitle}"`;

        case ACTIONS.FOLLOW_REQUEST:
            return `${fields.userName} wants to follow you`;

        case ACTIONS.FOLLOW_ACCEPTED:
            return `${fields.userName} has accepted your follow request`;

        case ACTIONS.POST_RESHARE:
            return `${fields.userName} reshared your post: "${fields.postTitle}"`;

        case ACTIONS.MESSAGE:
            return `${fields.userName} sent you a message: "${fields.messageText}"`;

        case ACTIONS.GROUP_POST:
            return `${fields.userName} posted in the group "${fields.groupName}": "${fields.postTitle}"`;

        case ACTIONS.JOB_SUGGEST:
            return `A new job suggestion for you: "${fields.jobTitle}" at ${fields.companyName}`;

        case ACTIONS.GROUP_ADDED:
            return `You have been added to the group: "${fields.groupName}"`;

        case ACTIONS.POLL_RESULT:
            return `The poll "${fields.pollTitle}" has ended. ${fields.winningOption} won with ${fields.votePercentage}% of the votes!`;

        case ACTIONS.EVENT_SUGGEST:
            return `You might be interested in this event: "${fields.eventTitle}" on ${fields.eventDate} at ${fields.eventLocation}`;

        case ACTIONS.GROUP_INVITE:
            return `${fields.userName} invited you to join the group "${fields.groupName}"`;

        case ACTIONS.GROUP_INVITE_ACCEPTED:
            return `${fields.userName} accepted your invitation to join the group "${fields.groupName}"`;

        case ACTIONS.GROUP_INVITE_REJECTED:
            return `${fields.userName} declined your invitation to join the group "${fields.groupName}"`;

        default:
            throw new Error(`Unknown action: ${action}`);
    }
};

module.exports = {
    actions: ACTIONS,
    generateNotificationBody,
};
