const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const feedRoute = require('./feed.route');
const docsRoute = require('./docs.route');
const contentRoute = require('./content.route');
const userConnectionRoute = require('./userconnection.route');
const companyRoute = require('./company.route');
const chatRoute = require('./chat.route');
const storiesRoute = require('./story.route');
const highlightRoute = require('./highlight.route');
const jobsRoute = require('./job.route');
const eventRoute = require('./event.route');
const planRoute = require('./plan.route');
const notificationRoute = require('./notification.route');
const groupRoute = require('./group.route');
const groupInvitationRoute = require('./groupInvitation.route');
const helpRequestRoute = require('./helpcenter.route');
const loginActivityRoute = require('./loginActivity.route');
const analyticRoute = require('./analytics.route');
const mediaRoute = require('./media.route');
// const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
    {
        path: '/auth',
        route: authRoute,
    },
    {
        path: '/users',
        route: userRoute,
    },
    {
        path: '/feeds',
        route: feedRoute,
    },
    {
        path: '/contents',
        route: contentRoute,
    },
    {
        path: '/connections',
        route: userConnectionRoute,
    },
    {
        path: '/jobs',
        route: jobsRoute,
    },
    {
        path: '/companies',
        route: companyRoute,
    },
    {
        path: '/plans',
        route: planRoute,
    },
    {
        path: '/analytics',
        route: analyticRoute,
    },

    {
        path: '/groups',
        route: groupRoute,
    },
    {
        path: '/',
        route: groupInvitationRoute,
    },

    {
        path: '/notifications',
        route: notificationRoute,
    },
    {
        path: '/helpcenter',
        route: helpRequestRoute,
    },

    {
        path: '/loginActivity',
        route: loginActivityRoute,
    },

    { path: '/chat', route: chatRoute },
    { path: '/stories', route: storiesRoute },
    { path: '/highlights', route: highlightRoute },
    { path: '/events', route: eventRoute },
    { path: '/media', route: mediaRoute },
];

const devRoutes = [
    // routes available only in development mode
    {
        path: '/docs',
        route: docsRoute,
    },
    {
        path: '/docs',
        route: docsRoute,
    },
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

/* istanbul ignore next */
// if (config.env === 'development') {
devRoutes.forEach((route) => {
    router.use(route.path, route.route);
});
// }

module.exports = router;
