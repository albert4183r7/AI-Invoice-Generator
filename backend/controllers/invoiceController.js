const Invoice = require('../models/Invoice');
const logger = require('../logger');

// protect() always attaches a full user document, so `_id` is present; the
// fallback keeps these handlers working with the lightweight `{ id }` object
// some tests build by hand.
const userIdOf = (req) => req.user._id || req.user.id;

// Turns a Mongoose cast/validation failure into a 400 instead of letting it
// fall through to the generic 500. A malformed id or a status outside the
// schema enum is the caller's mistake, not a server fault.
const handleInvoiceError = (res, error, action) => {
    if (error.name === 'CastError' || error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Invalid invoice data' });
    }

    logger.error({ err: error }, `failed to ${action} invoice`);
    return res.status(500).json({ message: `Error ${action} invoice` });
};

// Shared by create and update: stamps each line's own total onto the item and
// accumulates the invoice-level subtotal and tax.
const calculateTotals = (items) => {
    let subtotal = 0;
    let taxTotal = 0;

    const processedItems = items.map((item) => {
        const itemTotal = item.unitPrice * item.quantity;
        subtotal += itemTotal;
        taxTotal += (itemTotal * (item.taxPercent || 0)) / 100;

        return { ...item, total: itemTotal };
    });

    return { processedItems, subtotal, taxTotal, total: subtotal + taxTotal };
};

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
exports.createInvoice = async (req, res) => {
    try {
        const {
            invoiceNumber,
            invoiceDate,
            dueDate,
            billFrom,
            billTo,
            items,
            notes,
            paymentTerms,
        } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'An invoice needs at least one line item' });
        }

        const { processedItems, subtotal, taxTotal, total } = calculateTotals(items);

        const invoice = new Invoice({
            user: userIdOf(req),
            invoiceNumber,
            invoiceDate,
            dueDate,
            billFrom,
            billTo,
            items: processedItems,
            notes,
            paymentTerms,
            subtotal,
            taxTotal,
            total,
        });

        await invoice.save();
        res.status(201).json(invoice);
    } catch (error) {
        handleInvoiceError(res, error, 'creating');
    }
};

// @desc    Get all invoices for logged-in user
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({ user: userIdOf(req) }).populate('user', 'name email');
        res.json(invoices);
    } catch (error) {
        handleInvoiceError(res, error, 'fetching');
    }
};

// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoiceById = async (req, res) => {
    try {
        // Scoping the query by owner rather than loading first and comparing
        // afterwards means another user's invoice is indistinguishable from one
        // that does not exist -- no existence leak, and no way to forget the
        // comparison.
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            user: userIdOf(req),
        }).populate('user', 'name email');

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        handleInvoiceError(res, error, 'fetching');
    }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
exports.updateInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            user: userIdOf(req),
        });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const {
            invoiceNumber,
            invoiceDate,
            dueDate,
            billFrom,
            billTo,
            items,
            notes,
            paymentTerms,
            status,
        } = req.body;

        // Apply only the fields actually present. The "Mark Paid" button sends
        // nothing but `status`, and the previous all-fields-at-once write
        // blanked the line items and reset the totals to 0 every time it ran.
        if (invoiceNumber !== undefined) invoice.invoiceNumber = invoiceNumber;
        if (invoiceDate !== undefined) invoice.invoiceDate = invoiceDate;
        if (dueDate !== undefined) invoice.dueDate = dueDate;
        if (billFrom !== undefined) invoice.billFrom = billFrom;
        if (billTo !== undefined) invoice.billTo = billTo;
        if (notes !== undefined) invoice.notes = notes;
        if (paymentTerms !== undefined) invoice.paymentTerms = paymentTerms;
        if (status !== undefined) invoice.status = status;

        // Totals are only recomputed when the line items themselves change.
        if (Array.isArray(items)) {
            const { processedItems, subtotal, taxTotal, total } = calculateTotals(items);

            invoice.items = processedItems;
            invoice.subtotal = subtotal;
            invoice.taxTotal = taxTotal;
            invoice.total = total;
        }

        // save() rather than findByIdAndUpdate so the schema's enum and
        // required validators actually run on the new values.
        const updatedInvoice = await invoice.save();
        res.json(updatedInvoice);
    } catch (error) {
        handleInvoiceError(res, error, 'updating');
    }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
exports.deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findOneAndDelete({
            _id: req.params.id,
            user: userIdOf(req),
        });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        handleInvoiceError(res, error, 'deleting');
    }
};
