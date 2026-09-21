const express = require('express');
const mongoose = require('mongoose');
const { isShuttingDown } = require('../lib/lifecycle');

const router = express.Router();

// mongoose.connection.readyState values, in order.
const MONGO_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/**
 * Liveness: is the process alive and not wedged?
 *
 * Deliberately does NOT check the database. If a dependency blips, every
 * instance failing liveness would restart the entire fleet at exactly the
 * moment it is least able to absorb the churn. Dependency health belongs in
 * readiness, where the consequence is being removed from rotation rather than
 * being killed.
 */
router.get('/healthz', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptimeSeconds: Math.round(process.uptime()),
    });
});

/**
 * Readiness: should this instance be receiving traffic right now?
 *
 * Returns 503 while the database is unreachable or while the process is
 * draining, so traffic moves away without the container being killed.
 */
router.get('/readyz', (req, res) => {
    const dbState = mongoose.connection.readyState;

    const checks = {
        mongodb: MONGO_STATES[dbState] || 'unknown',
        shuttingDown: isShuttingDown(),
    };

    const ready = dbState === 1 && !checks.shuttingDown;

    res.status(ready ? 200 : 503).json({
        status: ready ? 'ready' : 'not ready',
        checks,
    });
});

module.exports = router;
