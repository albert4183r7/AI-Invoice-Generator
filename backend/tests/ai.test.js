// FIX: Define the mock BEFORE requiring the controller
const mockGenerateContent = jest.fn();

jest.mock("@google/genai", () => {
    return {
        GoogleGenAI: jest.fn().mockImplementation(() => ({
            models: {
                generateContent: mockGenerateContent
            }
        }))
    };
});

// The invoice lookup is stubbed too, so these stay fast unit tests -- but the
// assertions below check *how* it is called, which is where the ownership
// scoping lives.
jest.mock('../models/Invoice', () => ({
    findOne: jest.fn(),
    find: jest.fn(),
}));

const Invoice = require('../models/Invoice');

const {
    parseInvoiceFromText,
    generateReminderEmail,
    getDashboardSummary,
} = require('../controllers/aiController');

describe('AI Controller Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        mockGenerateContent.mockClear();
        Invoice.findOne.mockReset();
        Invoice.find.mockReset();

        req = { body: { text: "Buatkan invoice untuk Budi" }, user: { _id: '507f1f77bcf86cd799439011' } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('parseInvoiceFromText', () => {
        it('should successfully parse invoice text and return JSON', async () => {
            const fakeJson = JSON.stringify({
                clientName: "Budi",
                items: [{ name: "Jasa", unitPrice: 500000 }]
            });

            mockGenerateContent.mockResolvedValue({ text: fakeJson });

            await parseInvoiceFromText(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    parsedData: expect.objectContaining({ clientName: "Budi" })
                })
            );
        });

        it('should handle a response whose text is exposed as a method', async () => {
            // Regression: the fallback branch reassigned a `const`, so any SDK
            // version that returned an accessor instead of a plain string
            // threw "Assignment to constant variable" and surfaced as a 500.
            const fakeJson = JSON.stringify({ clientName: "Siti", items: [] });
            mockGenerateContent.mockResolvedValue({ text: { text: () => fakeJson } });

            await parseInvoiceFromText(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    parsedData: expect.objectContaining({ clientName: "Siti" })
                })
            );
        });

        it('should strip markdown fences before parsing', async () => {
            mockGenerateContent.mockResolvedValue({
                text: '```json\n{"clientName":"Ana","items":[]}\n```'
            });

            await parseInvoiceFromText(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle errors when AI fails', async () => {
            mockGenerateContent.mockRejectedValue(new Error("API Overload"));

            await parseInvoiceFromText(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Failed to parse invoice data from text" })
            );
        });

        it('should not leak internal error detail to the client', async () => {
            mockGenerateContent.mockRejectedValue(
                new Error("upstream said: key AIzaSyExample is invalid")
            );

            await parseInvoiceFromText(req, res);

            const payload = res.json.mock.calls[0][0];
            expect(payload).not.toHaveProperty('details');
            expect(JSON.stringify(payload)).not.toContain('AIzaSyExample');
        });

        it('should reject an empty request body', async () => {
            req.body = {};
            await parseInvoiceFromText(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('generateReminderEmail', () => {
        it('should scope the invoice lookup to the calling user', async () => {
            Invoice.findOne.mockResolvedValue({
                billTo: { clientName: 'Client Corp', email: 'client@test.com' },
                billFrom: { businessName: 'My Biz' },
                invoiceNumber: 'INV-001',
                total: 220,
                dueDate: new Date('2026-10-01'),
            });
            mockGenerateContent.mockResolvedValue({ text: 'To: client@test.com' });

            req.body = { invoiceId: '507f1f77bcf86cd799439012' };
            await generateReminderEmail(req, res);

            // The query must carry the owner, or any authenticated user could
            // generate a reminder for -- and receive the client details of --
            // somebody else's invoice.
            expect(Invoice.findOne).toHaveBeenCalledWith({
                _id: '507f1f77bcf86cd799439012',
                user: '507f1f77bcf86cd799439011',
            });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 when the invoice is not the caller\'s', async () => {
            Invoice.findOne.mockResolvedValue(null);

            req.body = { invoiceId: '507f1f77bcf86cd799439012' };
            await generateReminderEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(mockGenerateContent).not.toHaveBeenCalled();
        });

        it('should report its own error, not the parser\'s', async () => {
            Invoice.findOne.mockRejectedValue(new Error("boom"));

            req.body = { invoiceId: '507f1f77bcf86cd799439012' };
            await generateReminderEmail(req, res);

            // This used to answer "Failed to parse invoice data from text",
            // copy-pasted from the endpoint above.
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Failed to generate reminder email" })
            );
        });
    });

    describe('getDashboardSummary', () => {
        it('should scope the invoice query to the calling user', async () => {
            Invoice.find.mockResolvedValue([]);

            await getDashboardSummary(req, res);

            expect(Invoice.find).toHaveBeenCalledWith({ user: '507f1f77bcf86cd799439011' });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should summarise paid and unpaid totals', async () => {
            Invoice.find.mockResolvedValue([
                { status: 'Paid', total: 100, invoiceNumber: 'A', invoiceDate: new Date('2026-01-01') },
                { status: 'Unpaid', total: 50, invoiceNumber: 'B', invoiceDate: new Date('2026-02-01') },
            ]);
            mockGenerateContent.mockResolvedValue({ text: '{"insights":["Good"]}' });

            await getDashboardSummary(req, res);

            const prompt = mockGenerateContent.mock.calls[0][0].contents;
            expect(prompt).toContain('Total revenue from paid invoices: 100.00');
            expect(prompt).toContain('Total outstanding amount from unpaid/pending invoices: 50.00');
            // Regression: the status was interpolated with `$(inv.status)`, so
            // the literal text "$(inv.status)" reached the model.
            expect(prompt).not.toContain('$(inv.status)');
            expect(prompt).toContain('with status Unpaid');
        });

        it('should return its own error message on failure', async () => {
            Invoice.find.mockRejectedValue(new Error("boom"));

            await getDashboardSummary(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Failed to generate dashboard summary" })
            );
        });
    });
});
