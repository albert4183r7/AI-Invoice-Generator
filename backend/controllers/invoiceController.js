const Invoice = require("../models/Invoice");

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
exports.createInvoice = async (req, res) => {
    try {
        const user = req.user;
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

        // Calculate totals
        let subtotal = 0;
        let taxTotal = 0;
        
        // FIX: Map over items to calculate and ADD the 'total' field to each item object
        const processedItems = items.map(item => {
            const itemTotal = item.unitPrice * item.quantity;
            const itemTax = (itemTotal * (item.taxPercent || 0)) / 100;
            
            subtotal += itemTotal;
            taxTotal += itemTax;

            return {
                ...item,
                total: itemTotal // Add the required total field
            };
        });

        const total = subtotal + taxTotal;

        const invoice = new Invoice({
            user: user._id || user.id, // Ensure we extract the ID string
            invoiceNumber,
            invoiceDate,
            dueDate,
            billFrom,
            billTo,
            items: processedItems, // Use the processed items with totals
            notes,
            paymentTerms,
            subtotal,
            taxTotal,
            total,
        });

        await invoice.save();
        res.status(201).json(invoice);
    } catch (error) {
        res.status(500).json({ message: 'Error creating invoice', error: error.message });
    }
};

// @desc    Get all invoices for logged-in user
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res) => {
    try {
        // Handle both _id (mongoose object) and id (JWT payload)
        const userId = req.user._id || req.user.id;
        const invoices = await Invoice.find({user: userId}).populate('user', 'name email');
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invoices', error: error.message });
    }
};

// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('user', 'name email');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        
        const userId = req.user._id || req.user.id;
        
        // Check if the invoice belongs to the user
        if (invoice.user._id.toString() !== userId.toString()) {
            return res.status(401).json({ message: 'Not Authorized' });
        }
        
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invoice', error: error.message });
    }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
exports.updateInvoice = async (req, res) => {
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
            status,
        } = req.body;

        // Recalculate totals if items changed
        let subtotal = 0;
        let taxTotal = 0;
        let processedItems = items;

        if (items && items.length > 0) {
            processedItems = items.map(item => {
                const itemTotal = item.unitPrice * item.quantity;
                const itemTax = (itemTotal * (item.taxPercent || 0)) / 100;
                
                subtotal += itemTotal;
                taxTotal += itemTax;

                return { ...item, total: itemTotal };
            });
        }
        
        const total = subtotal + taxTotal;

        const updatedInvoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            {
                invoiceNumber,
                invoiceDate,
                dueDate,
                billFrom,
                billTo,
                items: processedItems,
                notes,
                paymentTerms,
                status,
                subtotal,
                taxTotal,
                total,
            },
            { new: true }
        );

        if (!updatedInvoice) return res.status(404).json({ message: 'Invoice not found' });

        res.json(updatedInvoice);
    } catch (error) {
        res.status(500).json({ message: 'Error updating invoice', error: error.message });
    }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
exports.deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndDelete(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting invoice', error: error.message });
    }
};