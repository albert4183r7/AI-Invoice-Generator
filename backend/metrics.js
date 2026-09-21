const client = require('prom-client');

const register = new client.Registry();
register.setDefaultLabels({ service: 'invoice-api' });

// Runtime metrics: event loop lag, heap usage, GC pauses, open file
// descriptors. These are what tell you a process is unhealthy before users
// notice, and they cost nothing to collect.
client.collectDefaultMetrics({ register });

// The RED signals -- Rate, Errors, Duration -- as three series.
const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests handled.',
    labelNames: ['method', 'route', 'status'],
    registers: [register],
});

const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request latency in seconds.',
    labelNames: ['method', 'route', 'status'],
    // Buckets cluster around the latency budget so p95/p99 stay accurate
    // in the range we would actually alert on.
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register],
});

const httpRequestsInFlight = new client.Gauge({
    name: 'http_requests_in_flight',
    help: 'Number of HTTP requests currently being served.',
    registers: [register],
});

/**
 * Report the matched route pattern (e.g. "/api/invoices/:id") rather than the
 * raw path. Labelling by raw path gives every invoice id its own time series,
 * which is how a metrics backend gets killed by label cardinality.
 */
const routeLabel = (req) => {
    if (req.route && req.route.path) {
        const base = req.baseUrl || '';
        // A router mounted at /api/invoices whose route path is "/" would
        // otherwise report "/api/invoices/", which does not line up with the
        // parameterised series ("/api/invoices/:id") on a dashboard.
        return req.route.path === '/' ? base || '/' : `${base}${req.route.path}`;
    }
    return req.baseUrl || 'unmatched';
};

const metricsMiddleware = (req, res, next) => {
    httpRequestsInFlight.inc();

    const stopTimer = httpRequestDuration.startTimer();
    let recorded = false;

    const record = () => {
        // 'finish' and 'close' can both fire for one request; count it once.
        if (recorded) return;
        recorded = true;

        httpRequestsInFlight.dec();

        const labels = {
            method: req.method,
            route: routeLabel(req),
            status: res.statusCode,
        };

        stopTimer(labels);
        httpRequestsTotal.inc(labels);
    };

    res.on('finish', record);
    res.on('close', record);

    next();
};

module.exports = {
    register,
    metricsMiddleware,
    httpRequestsTotal,
    httpRequestDuration,
    httpRequestsInFlight,
};
