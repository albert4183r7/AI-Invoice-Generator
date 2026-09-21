const pino = require('pino');

// Anything that could carry a credential. pino applies these to every log
// line, so a secret cannot escape just because it happened to be attached to
// an object that got logged later.
const REDACT_PATHS = [
    'req.headers.authorization',
    'req.headers.cookie',
    'req.body.password',
    'req.body.token',
    'res.headers["set-cookie"]',
    'password',
    'token',
    'JWT_SECRET',
    'GEMINI_API_KEY',
    'MONGO_URI',
];

// Pretty output is for a human at a terminal. Production and test both want
// single-line JSON that a log aggregator can parse -- and keeping the test
// environment on JSON means pino never spins up its transport worker thread
// while Jest is running.
const usesPrettyTransport = !['production', 'test'].includes(process.env.NODE_ENV);

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: { service: 'invoice-api' },
    redact: { paths: REDACT_PATHS, censor: '[redacted]' },
    ...(usesPrettyTransport && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss.l',
                ignore: 'pid,hostname,service',
            },
        },
    }),
});

module.exports = logger;
