/**
 * Whether the process has begun shutting down.
 *
 * Readiness returns 503 once this flips, so a load balancer stops routing new
 * requests here while the in-flight ones finish. It lives in its own module
 * because the health route that reads it and the shutdown handler that sets it
 * are in different files.
 */
let shuttingDown = false;

module.exports = {
    isShuttingDown: () => shuttingDown,
    beginShutdown: () => {
        shuttingDown = true;
    },
};
