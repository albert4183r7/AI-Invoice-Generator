const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User'); // Import User Model

// FIX: Hardcode the ID inside the mock
const MOCK_USER_ID = '507f1f77bcf86cd799439011';

jest.mock('../middlewares/authMiddleware', () => ({
    protect: (req, res, next) => {
        // We use the same ID here as we will use to create the user below
        const mockId = '507f1f77bcf86cd799439011';
        req.user = { _id: mockId, id: mockId }; 
        next();
    }
}));

const invoiceRoutes = require('../routes/invoiceRoutes');

const app = express();
app.use(express.json());
app.use('/api/invoices', invoiceRoutes);

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // FIX: Create the user in the DB so .populate('user') works
    // Without this, the controller returns 500 because invoice.user is null
    await User.create({
        _id: MOCK_USER_ID,
        name: "Test User",
        email: "testuser@example.com",
        password: "password123"
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
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
        const res = await request(app)
            .post('/api/invoices')
            .send(sampleInvoice);

        if (res.statusCode !== 201) {
            console.error("Create Invoice Error Log:", res.body);
        }

        expect(res.statusCode).toEqual(201);
        expect(res.body.invoiceNumber).toEqual("INV-001");
        expect(res.body.total).toEqual(220); 
        
        createdInvoiceId = res.body._id;
    });

    it('GET /api/invoices - Should return list of invoices', async () => {
        const res = await request(app).get('/api/invoices');
        
        if (res.statusCode !== 200) console.error("Get Invoices Error:", res.body);
        
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('GET /api/invoices/:id - Should return detail of specific invoice', async () => {
        const res = await request(app).get(`/api/invoices/${createdInvoiceId}`);
        
        // If this fails, it will print the error details
        if (res.statusCode !== 200) console.error("Get Invoice Detail Error:", res.body);

        expect(res.statusCode).toEqual(200);
        expect(res.body._id).toEqual(createdInvoiceId);
    });

    it('PUT /api/invoices/:id - Should update invoice status', async () => {
        const res = await request(app)
            .put(`/api/invoices/${createdInvoiceId}`)
            .send({ status: 'Paid' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('Paid');
    });

    it('DELETE /api/invoices/:id - Should delete invoice', async () => {
        const res = await request(app).delete(`/api/invoices/${createdInvoiceId}`);
        expect(res.statusCode).toEqual(200);
        
        const checkRes = await request(app).get(`/api/invoices/${createdInvoiceId}`);
        expect(checkRes.statusCode).toEqual(404);
    });
});