import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CreateInvoice from './CreateInvoice';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';

// Mock Dependencies
vi.mock('../../utils/axiosInstance', () => ({
    default: {
        post: vi.fn().mockResolvedValue({ data: {} }),
        get: vi.fn().mockResolvedValue({ data: [] }) // Mock get invoices untuk generate number
    }
}));

// Helper component untuk menyediakan Context
const TestWrapper = ({ children }) => (
    <AuthProvider>
        <BrowserRouter>
            {children}
        </BrowserRouter>
    </AuthProvider>
);

describe('CreateInvoice Component', () => {
    it('should render the form correctly', () => {
        render(<CreateInvoice />, { wrapper: TestWrapper });
        
        expect(screen.getByText(/Create Invoice/i)).toBeInTheDocument();
        expect(screen.getByText(/Bill From/i)).toBeInTheDocument();
        expect(screen.getByText(/Bill To/i)).toBeInTheDocument();
    });

    it('should update inputs when typed', () => {
        render(<CreateInvoice />, { wrapper: TestWrapper });

        const clientInput = screen.getByLabelText(/Client Name/i);
        fireEvent.change(clientInput, { target: { value: 'Test Client' } });

        expect(clientInput.value).toBe('Test Client');
    });

    it('should calculate total automatically', () => {
        render(<CreateInvoice />, { wrapper: TestWrapper });

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

    it('should allow adding a new item row', () => {
        render(<CreateInvoice />, { wrapper: TestWrapper });

        const addItemBtn = screen.getByText(/Add Item/i);
        fireEvent.click(addItemBtn);

        // Sekarang harus ada 2 baris input price
        const priceInputs = screen.getAllByPlaceholderText('0.00');
        expect(priceInputs).toHaveLength(2);
    });
});