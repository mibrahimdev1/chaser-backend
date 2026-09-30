const { version } = require('../../package.json');
const config = require('../config/config');

const swaggerDef = {
    openapi: '3.0.0',
    info: {
        title: 'Chaser App API documentation',
        version,
    },
    servers: [
        {
            url: `https://api.chaserthenetwork.com/v1`,
        },
        {
            url: `https://test.chaserthenetwork.com/v1`,
        },
        {
            url: `http://localhost:${config.port}/v1`,
        },
        {
            url: `https://b2b1ba88d4a6.ngrok-free.app/v1`,
        },
    ],
};

module.exports = swaggerDef;
