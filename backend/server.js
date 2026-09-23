require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');
const mongoose = require('mongoose');

const logger = require('./logger');
const connectDB = require('./config/db');
const { register, metricsMiddleware } = require('./metrics');
const { beginShutdown } = require('./lib/lifecycle');
const healthRoutes = require('./routes/healthRoutes');

const authRoutes = require('./routes/authRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Fail fast on missing configuration. This is a deploy-time mistake that no
// amount of retrying will fix, and starting anyway only moves the failure to
// the first request that happens to need the value.
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
    logger.fatal({ missing: missingEnv }, 'required environment variables are not set');
    process.exit(1);
}

const PORT = process.env.PORT || 5000;

// How long to wait for in-flight requests to drain before exiting anyway.
// Must stay below docker-compose's stop_grace_period, or Docker sends SIGKILL
// while this is still running.
const SHUTDOWN_TIMEOUT_MS = 15_000;

const app = express();

// Behind a reverse proxy or load balancer, trust the first hop so rate
// limiting and request logs see the real client IP rather than the proxy's.
app.set('trust proxy', 1);

app.use(
    helmet({
        // The SPA is served from a different origin in development.
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
);

// Structured request logging with a per-request id. An inbound X-Request-Id is
// reused so a single request can be followed across services.
app.use(
    pinoHttp({
        logger,
        genReqId: (req, res) => {
            const id = req.headers['x-request-id'] || crypto.randomUUID();
            res.setHeader('X-Request-Id', id);
            return id;
        },
        // The default serializers dump every request and response header onto
        // every line -- the Content-Security-Policy string alone is longer than
        // the rest of the entry, on every single request. Keep the fields worth
        // querying and drop the rest.
        serializers: {
            req: (req) => ({
                id: req.id,
                method: req.method,
                url: req.url,
                remoteAddress: req.remoteAddress,
            }),
            res: (res) => ({
                statusCode: res.statusCode,
            }),
        },
    })
);

app.use(metricsMiddleware);

const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:80',
    'http://localhost',
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Same-origin requests, curl and server-to-server calls send no
            // Origin header at all.
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            // Outside production stay permissive, so local tooling on other
            // ports keeps working. Production enforces the allowlist.
            if (process.env.NODE_ENV !== 'production') {
                return callback(null, true);
            }

            const err = new Error(`Origin ${origin} is not allowed by CORS`);
            err.status = 403;
            return callback(err);
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        // The session travels in a cookie, so the browser only sends it when
        // the request is explicitly credentialed. This requires a concrete
        // origin above -- the wildcard is not permitted alongside it.
        credentials: true,
    })
);

// Populates req.cookies, which is where protect() looks for the session
// token. Must run before any route that authenticates.
app.use(cookieParser());

app.use(express.json({ limit: '1mb' }));

// Health and metrics are mounted before the rate limiter on purpose: a probe
// that fires every few seconds must never be throttled, or the limiter itself
// becomes an outage.
app.use(healthRoutes);

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 300,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { message: 'Too many requests, please try again later.' },
    })
);

app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/ai', aiRoutes);

app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
});

// Central error handler. Without one, Express returns an HTML stack trace and
// leaks internals; this keeps responses JSON and detail out of the body.
app.use((err, req, res, next) => {
    const status = err.status || 500;

    if (status >= 500) {
        req.log.error({ err }, 'request failed');
    }

    res.status(status).json({
        message: status >= 500 ? 'Internal server error' : err.message,
    });
});

const server = app.listen(PORT, () => {
    logger.info({ port: PORT }, 'API listening');
});

// Started after listen() so the process is serving (and can report readiness)
// even while the database is still coming up.
connectDB();

// --- Graceful shutdown -----------------------------------------------------
// Without this, replacing a container kills in-flight requests mid-response.
// Order matters: flip readiness first so new traffic stops arriving, then let
// existing requests finish, then close the database.
let shutdownStarted = false;

const shutdown = (signal) => {
    if (shutdownStarted) return;
    shutdownStarted = true;
    beginShutdown();

    logger.info({ signal }, 'shutdown started; draining connections');

    const forceExit = setTimeout(() => {
        logger.error({ timeoutMs: SHUTDOWN_TIMEOUT_MS }, 'shutdown timed out; forcing exit');
        process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    server.close(async (err) => {
        if (err) {
            logger.error({ err }, 'error closing HTTP server');
        }

        try {
            await mongoose.connection.close(false);
            clearTimeout(forceExit);
            logger.info('shutdown complete');
            process.exit(0);
        } catch (closeErr) {
            logger.error({ err: closeErr }, 'error closing database connection');
            process.exit(1);
        }
    });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
