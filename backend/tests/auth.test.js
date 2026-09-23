const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const authRoutes = require('../routes/authRoutes');

// FIX: Set JWT_SECRET for testing environment
process.env.JWT_SECRET = 'test_secret_123';

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use('/api/auth', authRoutes);

let mongoServer;
let agent;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // An agent carries the session cookie between requests, which is what a
  // browser does and what cookie-based auth depends on.
  agent = request.agent(app);
});

afterAll(async () => {
  await mongoose.disconnect();

  // Guarded: if beforeAll threw (a failed binary download, say) mongoServer is
  // undefined, and calling .stop() on it would replace the real error with a
  // TypeError from afterAll.
  if (mongoServer) await mongoServer.stop();
});

describe('Auth Integration Tests', () => {

  it('POST /api/auth/register - should register a user and start a session', async () => {
    const res = await agent
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('name', 'Test User');
    expect(res.body).toHaveProperty('email', 'test@example.com');

    // The token must never be in the body -- it is delivered as an httpOnly
    // cookie precisely so that no script on the page can read it back.
    expect(res.body).not.toHaveProperty('token');

    const setCookie = String(res.headers['set-cookie']);
    expect(setCookie).toContain('token=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
  });

  it('POST /api/auth/register - should fail with duplicate email', async () => {
    const res = await agent
      .post('/api/auth/register')
      .send({
        name: 'Test User 2',
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'User already exists');
  });

  it('GET /api/auth/me - should return the user behind the session cookie', async () => {
    const res = await agent.get('/api/auth/me');

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('email', 'test@example.com');
    expect(res.body).not.toHaveProperty('password');
  });

  it('GET /api/auth/me - should reject a request with no session', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.statusCode).toEqual(401);
  });

  it('GET /api/auth/me - should reject a token signed with the wrong secret', async () => {
    const forged = jwt.sign({ id: '507f1f77bcf86cd799439011' }, 'not-the-secret');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${forged}`);

    expect(res.statusCode).toEqual(401);
  });

  it('GET /api/auth/me - should reject a valid token whose user no longer exists', async () => {
    // A correctly signed token can outlive the account it was issued for.
    // protect() used to call next() with req.user === null here, and every
    // handler downstream then dereferenced it into a 500.
    const ghostToken = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString() },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${ghostToken}`);

    expect(res.statusCode).toEqual(401);
  });

  it('POST /api/auth/login - should start a session for valid credentials', async () => {
    const loginAgent = request.agent(app);

    const res = await loginAgent
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).not.toHaveProperty('token');
    expect(String(res.headers['set-cookie'])).toContain('token=');

    await loginAgent.get('/api/auth/me').expect(200);
  });

  it('POST /api/auth/login - should reject a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong-password' });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'Invalid email or password');
  });

  it('POST /api/auth/logout - should clear the session cookie', async () => {
    const sessionAgent = request.agent(app);

    await sessionAgent
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);

    await sessionAgent.get('/api/auth/me').expect(200);

    const res = await sessionAgent.post('/api/auth/logout');

    expect(res.statusCode).toEqual(200);
    // clearCookie must actually expire it, not just stop sending it.
    expect(String(res.headers['set-cookie'])).toContain('token=;');

    await sessionAgent.get('/api/auth/me').expect(401);
  });

  it('PUT /api/auth/me - should let a field be cleared', async () => {
    const sessionAgent = request.agent(app);

    await sessionAgent
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);

    await sessionAgent
      .put('/api/auth/me')
      .send({ businessName: 'Acme LLC', address: '1 Main St' })
      .expect(200);

    // An empty string must replace the stored value. Assigning with `||` made
    // this fall through to the old one, so the request succeeded, the response
    // returned the previous text, and the UI refilled the field the user had
    // just emptied.
    const res = await sessionAgent.put('/api/auth/me').send({ address: '' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('address', '');
    // The fields that were not sent are untouched.
    expect(res.body).toHaveProperty('businessName', 'Acme LLC');

    // And it is persisted, not merely echoed back.
    const after = await sessionAgent.get('/api/auth/me');
    expect(after.body).toHaveProperty('address', '');
  });

  it('PUT /api/auth/me - should reject an empty name', async () => {
    const sessionAgent = request.agent(app);

    await sessionAgent
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);

    // `name` is required by the schema, so clearing it is a 400 rather than a
    // save that trips the model's own validator into a 500.
    const res = await sessionAgent.put('/api/auth/me').send({ name: '   ' });

    expect(res.statusCode).toEqual(400);

    const after = await sessionAgent.get('/api/auth/me');
    expect(after.body).toHaveProperty('name', 'Test User');
  });
});
