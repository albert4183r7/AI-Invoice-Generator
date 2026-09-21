const mongoose = require('mongoose');
const logger = require('../logger');

const INITIAL_RETRY_MS = 1_000;
const MAX_RETRY_MS = 30_000;

/**
 * Connect to MongoDB, retrying transient failures with exponential backoff.
 *
 * This deliberately does NOT call process.exit() on a failed connection. A
 * database that is briefly unavailable is a normal, recoverable event, and
 * killing the process turns a short outage into a crash loop. Instead the
 * connection is retried in the background while /readyz reports the instance
 * as not-ready, so the orchestrator removes it from rotation without
 * restarting it.
 */
const connectDB = async () => {
    let retryMs = INITIAL_RETRY_MS;

    const attempt = async () => {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            retryMs = INITIAL_RETRY_MS;
            logger.info('MongoDB connected');
        } catch (err) {
            logger.error({ err, retryInMs: retryMs }, 'MongoDB connection failed; retrying');
            // unref() so a pending retry never keeps the process alive during
            // a graceful shutdown.
            setTimeout(attempt, retryMs).unref();
            retryMs = Math.min(retryMs * 2, MAX_RETRY_MS);
        }
    };

    await attempt();
};

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

module.exports = connectDB;
