const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test_secret_123';

const authRoutes = require('../routes/authRoutes');
const invoiceRoutes = require('../routes/invoiceRoutes');

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);

let mongoServer;

// Two real, separately authenticated users. The previous version of this file
// stubbed out `protect` and injected a fixed req.user, which meant the
// ownership checks in the controller were never exercised -- and an invoice
// belonging to someone else could be read, rewritten and deleted without a
// single test noticing.
let owner;
let intruder;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    owner = request.agent(app);
    await owner
        .post('/api/auth/register')
        .send({ name: 'Owner', email: 'owner@example.com', password: 'password123' })
        .expect(201);

    intruder = request.agent(app);
    await intruder
        .post('/api/auth/register')
        .send({ name: 'Intruder', email: 'intruder@example.com', password: 'password123' })
        .expect(201);
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
});

describe('Invoice API Integration Tests', () => {
    let createdInvoiceId;

    const sampleInvoice = {
        invoiceNumber: "INV-001",
        billFrom: { businessName: "My Biz" },
        billTo: { clientName: "Client Corp", email: "client@test.com" },
        items: [
            { name: "Design Service", quantity: 2, unitPrice: 100, taxPercent: 10 }
        ],
        dueDate: new Date().toISOString()
    };

    it('POST /api/invoices - Should create a new invoice', async () => {
        const res = await owner.post('/api/invoices').send(sampleInvoice);

        if (res.statusCode !== 201) {
            console.error("Create Invoice Error Log:", res.body);
        }

        expect(res.statusCode).toEqual(201);
        expect(res.body.invoiceNumber).toEqual("INV-001");
        expect(res.body.total).toEqual(220);

        createdInvoiceId = res.body._id;
    });

    it('POST /api/invoices - Should reject an invoice with no line items', async () => {
        const res = await owner
            .post('/api/invoices')
            .send({ invoiceNumber: "INV-EMPTY", billTo: { clientName: "Nobody" } });

        // Previously this reached items.map() with items undefined and
        // surfaced as a 500 with a driver error in the body.
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toMatch(/line item/i);
    });

    it('GET /api/invoices - Should return only the caller\'s invoices', async () => {
        const res = await owner.get('/api/invoices');

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBeGreaterThan(0);

        // The other user must not see any of them.
        const otherRes = await intruder.get('/api/invoices');
        expect(otherRes.statusCode).toEqual(200);
        expect(otherRes.body).toEqual([]);
    });

    it('GET /api/invoices/:id - Should return detail of specific invoice', async () => {
        const res = await owner.get(`/api/invoices/${createdInvoiceId}`);

        if (res.statusCode !== 200) console.error("Get Invoice Detail Error:", res.body);

        expect(res.statusCode).toEqual(200);
        expect(res.body._id).toEqual(createdInvoiceId);
    });

    it('GET /api/invoices/:id - Should not expose another user\'s invoice', async () => {
        const res = await intruder.get(`/api/invoices/${createdInvoiceId}`);

        expect(res.statusCode).toEqual(404);
    });

    it('PUT /api/invoices/:id - Should update invoice status', async () => {
        const res = await owner
            .put(`/api/invoices/${createdInvoiceId}`)
            .send({ status: 'Paid' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('Paid');
    });

    it('PUT /api/invoices/:id - A status-only update must not wipe the line items', async () => {
        // Regression: the handler wrote every field on every update, so the
        // "Mark Paid" button -- which sends nothing but `status` -- blanked
        // `items` and reset subtotal, tax and total to 0.
        const res = await owner
            .put(`/api/invoices/${createdInvoiceId}`)
            .send({ status: 'Unpaid' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('Unpaid');
        expect(res.body.items).toHaveLength(1);
        expect(res.body.items[0].name).toEqual('Design Service');
        expect(res.body.subtotal).toEqual(200);
        expect(res.body.taxTotal).toEqual(20);
        expect(res.body.total).toEqual(220);
    });

    it('PUT /api/invoices/:id - Should recompute totals when items change', async () => {
        const res = await owner
            .put(`/api/invoices/${createdInvoiceId}`)
            .send({ items: [{ name: 'Consulting', quantity: 3, unitPrice: 50, taxPercent: 0 }] });

        expect(res.statusCode).toEqual(200);
        expect(res.body.total).toEqual(150);
        expect(res.body.items[0].total).toEqual(150);
    });

    it('PUT /api/invoices/:id - Should not let another user update the invoice', async () => {
        const res = await intruder
            .put(`/api/invoices/${createdInvoiceId}`)
            .send({ status: 'Paid' });

        expect(res.statusCode).toEqual(404);

        // And the owner's copy is untouched.
        const check = await owner.get(`/api/invoices/${createdInvoiceId}`);
        expect(check.body.status).toEqual('Unpaid');
    });

    it('PUT /api/invoices/:id - Should reject a status outside the schema enum', async () => {
        const res = await owner
            .put(`/api/invoices/${createdInvoiceId}`)
            .send({ status: 'Pending' });

        expect(res.statusCode).toEqual(400);
    });

    it('DELETE /api/invoices/:id - Should not let another user delete the invoice', async () => {
        const res = await intruder.delete(`/api/invoices/${createdInvoiceId}`);

        expect(res.statusCode).toEqual(404);

        await owner.get(`/api/invoices/${createdInvoiceId}`).expect(200);
    });

    it('DELETE /api/invoices/:id - Should delete invoice for its owner', async () => {
        const res = await owner.delete(`/api/invoices/${createdInvoiceId}`);
        expect(res.statusCode).toEqual(200);

        const checkRes = await owner.get(`/api/invoices/${createdInvoiceId}`);
        expect(checkRes.statusCode).toEqual(404);
    });
});
