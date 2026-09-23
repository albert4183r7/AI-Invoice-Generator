import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CreateInvoice from './CreateInvoice';
import { BrowserRouter } from 'react-router-dom';

// Mock Dependencies
vi.mock('../../utils/axiosInstance', () => ({
    default: {
        post: vi.fn().mockResolvedValue({ data: {} }),
        get: vi.fn().mockResolvedValue({ data: [] }) // Mock get invoices untuk generate number
    }
}));

// Stub the auth context rather than mounting the real AuthProvider: the
// provider fires a /api/auth/me request on mount, whose late resolution landed
// outside act() and warned on every test here. This component only reads
// `user` for prefill, so a static value is enough.
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: null,
        isAuthenticated: false,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
    }),
    AuthProvider: ({ children }) => children,
}));

// Helper component untuk menyediakan Context
const TestWrapper = ({ children }) => (
    <BrowserRouter>
        {children}
    </BrowserRouter>
);

// Renders and lets the mount-time invoice-number request settle, so its state
// updates land inside act(). The mocked GET returns an empty list, so the
// generated number is INV-001 — asserting on it also covers that path.
const renderForm = async () => {
    const result = render(<CreateInvoice />, { wrapper: TestWrapper });
    await waitFor(() => expect(screen.getByDisplayValue('INV-001')).toBeInTheDocument());
    return result;
};

describe('CreateInvoice Component', () => {
    it('should render the form correctly', async () => {
        await renderForm();

        expect(screen.getByText(/Create Invoice/i)).toBeInTheDocument();
        expect(screen.getByText(/Bill From/i)).toBeInTheDocument();
        expect(screen.getByText(/Bill To/i)).toBeInTheDocument();
    });

    it('should update inputs when typed', async () => {
        await renderForm();

        const clientInput = screen.getByLabelText(/Client Name/i);
        fireEvent.change(clientInput, { target: { value: 'Test Client' } });

        expect(clientInput.value).toBe('Test Client');
    });

    it('should calculate total automatically', async () => {
        await renderForm();

        // Isi Price dan Quantity
        // Note: Di tabel, input tidak punya label standard, jadi kita cari by placeholder atau role
        const priceInputs = screen.getAllByPlaceholderText('0.00');
        const qtyInputs = screen.getAllByPlaceholderText('1');

        fireEvent.change(priceInputs[0], { target: { value: '100' } });
        fireEvent.change(qtyInputs[0], { target: { value: '2' } });

        // Cek apakah Total di bawah berubah jadi 200 (100 * 2)
        // Karena ini real-time calculation
        const totalElements = screen.getAllByText('$200.00');
        expect(totalElements.length).toBeGreaterThan(0);
    });

    it('should keep the line total pre-tax so the rows sum to the Subtotal', async () => {
        await renderForm();

        const priceInputs = screen.getAllByPlaceholderText('0.00');
        const qtyInputs = screen.getAllByPlaceholderText('1');
        const taxInputs = screen.getAllByPlaceholderText('0');

        fireEvent.change(priceInputs[0], { target: { value: '100' } });
        fireEvent.change(qtyInputs[0], { target: { value: '2' } });
        fireEvent.change(taxInputs[0], { target: { value: '10' } });

        // Row total stays at the pre-tax 200; the 10% goes to the Tax line only.
        // Tax-inclusive rows would print 220 here and stop matching the API,
        // which stores each line's total pre-tax. The row and the Subtotal line
        // therefore both read $200.00 — that agreement is the whole assertion.
        expect(screen.getAllByText('$200.00')).toHaveLength(2);
        expect(screen.getByText('$20.00')).toBeInTheDocument();
        expect(screen.getByText('$220.00')).toBeInTheDocument();
    });

    it('should allow adding a new item row', async () => {
        await renderForm();

        const addItemBtn = screen.getByText(/Add Item/i);
        fireEvent.click(addItemBtn);

        // Sekarang harus ada 2 baris input price
        const priceInputs = screen.getAllByPlaceholderText('0.00');
        expect(priceInputs).toHaveLength(2);
    });
});