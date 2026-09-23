const { GoogleGenAI } = require('@google/genai');
const Invoice = require('../models/Invoice');
const logger = require('../logger');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = 'gemini-2.5-flash';

const userIdOf = (req) => req.user._id || req.user.id;

// `response.text` is a plain string in current SDK versions, but earlier
// releases exposed it as a method. Normalise both. Note this has to be `let`:
// the fallback branch reassigns it.
const extractText = (response) => {
    let text = response.text;

    if (typeof text !== 'string') {
        if (typeof text?.text === 'function') {
            text = text.text();
        } else {
            throw new Error('Could not extract text from AI response.');
        }
    }

    return text;
};

// The model routinely wraps its JSON in ```json fences regardless of how the
// prompt is phrased, so strip them at every parse site rather than repeating
// the cleanup in each caller.
const parseModelJson = (response) =>
    JSON.parse(extractText(response).replace(/```json/g, '').replace(/```/g, '').trim());

const parseInvoiceFromText = async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ message: 'Text is required' });
    }

    try {
        const prompt = `
        You are an expert invoice data extraction AI. Analyze the following text and extract the relevant information to create an invoice.
        The output MUST be a valid JSON object.

        The JSON object should have the following structure:
        {
            "clientName": "string",
            "email": "string (if available)",
            "address": "string (if available)",
            "items": [
                {
                    "name": "string",
                    "quantity": number,
                    "unitPrice": number
                }
            ]
    }

    Here is the text to parse:
    --- TEXT START ---
    ${text}
    --- TEXT END ---

    Extract the data and provide only the JSON object.
    `;

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
        });

        const parsedData = parseModelJson(response);

        res.status(200).json({ parsedData });
    } catch (error) {
        logger.error({ err: error }, 'failed to parse invoice from text');
        // The model's raw output and the driver's error text are not the
        // client's business -- they name internals, and can echo the prompt.
        res.status(500).json({ message: 'Failed to parse invoice data from text' });
    }
};

const generateReminderEmail = async (req, res) => {
    const { invoiceId } = req.body;

    if (!invoiceId) {
        return res.status(400).json({ message: 'Invoice ID is required' });
    }

    try {
        // Scoped by owner: generating a reminder for someone else's invoice
        // would otherwise hand back their client's name, email and balance.
        const invoice = await Invoice.findOne({
            _id: invoiceId,
            user: userIdOf(req),
        });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const prompt = `
        You are a professional and polite accounting assistant. Write a friendly reminder email to a client about an overdue or upcoming invoice payment.

        Use the following details to personalize the email:
        - Client Name: ${invoice.billTo.clientName}
        - Client Email: ${invoice.billTo.email || '[Client Email]'}
        - Invoice Number: ${invoice.invoiceNumber}
        - Amount Due: $${invoice.total.toFixed(2)}
        - Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
        - Business Name: ${invoice.billFrom.businessName}

        The output must be strictly formatted as follows:
        To: [Client Email]
        Subject: [Subject Line]
        Message Body:
        [Email Body Content]

        Sign the email with the [Your Name] placeholder and Business Name.

        The tone should be friendly but clear.
        `;

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
        });

        // Return both the generated text AND the client email found in the invoice
        res.status(200).json({
            reminderText: extractText(response),
            clientEmail: invoice.billTo.email || '',
        });
    } catch (error) {
        logger.error({ err: error }, 'failed to generate reminder email');
        res.status(500).json({ message: 'Failed to generate reminder email' });
    }
};

const getDashboardSummary = async (req, res) => {
    try {
        const invoices = await Invoice.find({ user: userIdOf(req) });

        if (invoices.length === 0) {
            return res.status(200).json({ summary: 'No invoices available to generate insights.' });
        }

        // Process and summarize data
        const totalInvoices = invoices.length;
        const paidInvoices = invoices.filter((inv) => inv.status === 'Paid');
        const unpaidInvoices = invoices.filter((inv) => inv.status !== 'Paid');
        const totalRevenue = paidInvoices.reduce((acc, inv) => acc + inv.total, 0);
        const totalOutstanding = unpaidInvoices.reduce((acc, inv) => acc + inv.total, 0);

        // Recent first, so "last 5" is actually the five newest rather than
        // whichever five the database happened to return first.
        const recentInvoices = invoices
            .slice()
            .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
            .slice(0, 5)
            .map((inv) => `Invoice #${inv.invoiceNumber} for ${inv.total.toFixed(2)} with status ${inv.status}`)
            .join('; ');

        const dataSummary = `
        - Total number of invoices: ${totalInvoices}
        - Total paid invoices: ${paidInvoices.length}
        - Total unpaid/pending invoices: ${unpaidInvoices.length}
        - Total revenue from paid invoices: ${totalRevenue.toFixed(2)}
        - Total outstanding amount from unpaid/pending invoices: ${totalOutstanding.toFixed(2)}
        - Recent invoices (last 5): ${recentInvoices}
        `;

        const prompt = `
        You are a friendly and insightful financial analyst for a small business owner.
        Based on the following summary of their invoice data, provide 2-3 concise and actionable insights.
        Each insight should be a short string in a JSON array.
        The insights should be encouraging and helpful. Do not just repeat the data.
        For example, if there is a high outstanding amount, suggest sending reminders. If revenue is high, be encouraging.

        Data Summary:
        ${dataSummary}

        Return your response as a valid JSON object with a single key "insights" which is an array of strings.
        Example format: { "insights": ["Your revenue is looking strong this month!", "You have 5 overdue invoices. Consider sending reminders to get paid faster."] }
        `;

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
        });

        res.status(200).json(parseModelJson(response));
    } catch (error) {
        logger.error({ err: error }, 'failed to generate dashboard summary');
        res.status(500).json({ message: 'Failed to generate dashboard summary' });
    }
};

module.exports = { parseInvoiceFromText, generateReminderEmail, getDashboardSummary };
