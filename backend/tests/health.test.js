const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const healthRoutes = require('../routes/healthRoutes');
const { beginShutdown } = require('../lib/lifecycle');

const app = express();
app.use(healthRoutes);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Health endpoints', () => {

  it('GET /healthz returns 200 regardless of database state', async () => {
    const res = await request(app).get('/healthz');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptimeSeconds).toBe('number');
  });

  it('GET /readyz returns 200 while the database is connected', async () => {
    const res = await request(app).get('/readyz');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.checks.mongodb).toBe('connected');
    expect(res.body.checks.shuttingDown).toBe(false);
  });

  it('GET /readyz returns 503 once the database is unreachable', async () => {
    await mongoose.disconnect();

    const res = await request(app).get('/readyz');

    expect(res.statusCode).toBe(503);
    expect(res.body.status).toBe('not ready');
    expect(res.body.checks.mongodb).not.toBe('connected');

    // Restore for the tests that follow.
    await mongoose.connect(mongoServer.getUri());
  });

  // Kept last: beginShutdown() flips module state for the rest of this file.
  it('GET /readyz returns 503 once shutdown has begun', async () => {
    beginShutdown();

    const res = await request(app).get('/readyz');

    expect(res.statusCode).toBe(503);
    expect(res.body.checks.shuttingDown).toBe(true);
  });
});
