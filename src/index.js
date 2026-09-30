const mongoose = require('mongoose');
const http = require('http');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const { initializeSocket } = require('./services/socket.service');
const { initializeAgenda } = require('./jobs/agenda');

let server;
mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
    logger.info('Connected to MongoDB');

    try {
        await initializeAgenda();
        logger.info('Agenda initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize Agenda:', error);
    }

    server = http.createServer(app);

    server.timeout = 300000;
    server.requestTimeout = 300000;
    server.headersTimeout = 65000;
    server.keepAliveTimeout = 65000;

    initializeSocket(server);
    server.listen(config.port, () => {
        logger.info(`Server listening on port ${config.port} (API + WebSocket)`);
        logger.info(
            `Timeouts: request=${server.requestTimeout}ms, headers=${server.headersTimeout}ms, keepAlive=${server.keepAliveTimeout}ms`,
        );
    });
});

const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed');
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
};

const unexpectedErrorHandler = (error) => {
    logger.error(error);
    exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    if (server) {
        server.close();
    }
});
