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

// Require controller AFTER mock is set up
const { parseInvoiceFromText } = require('../controllers/aiController');

describe('AI Controller Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        // Reset mock
        mockGenerateContent.mockClear();
        
        req = { body: { text: "Buatkan invoice untuk Budi" }, user: { id: '123' } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    it('should successfully parse invoice text and return JSON', async () => {
        const fakeJson = JSON.stringify({
            clientName: "Budi",
            items: [{ name: "Jasa", unitPrice: 500000 }]
        });

        // Mock the response object structure expected by the controller
        // The controller accesses response.text
        mockGenerateContent.mockResolvedValue({
            text: fakeJson
        });

        await parseInvoiceFromText(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                parsedData: expect.objectContaining({ clientName: "Budi" })
            })
        );
    });

    it('should handle errors when AI fails', async () => {
        mockGenerateContent.mockRejectedValue(new Error("API Overload"));

        await parseInvoiceFromText(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Failed to parse invoice data from text" })
        );
    });
});