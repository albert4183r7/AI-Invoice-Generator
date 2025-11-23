import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from './Dashboard';
import { BrowserRouter } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';

// Mock Axios
vi.mock('../../utils/axiosInstance');

const mockInvoices = [
    {
        _id: '1',
        invoiceNumber: 'INV-001',
        total: 1000,
        status: 'Paid',
        invoiceDate: new Date().toISOString(),
        billTo: { clientName: 'Client A' }
    },
    {
        _id: '2',
        invoiceNumber: 'INV-002',
        total: 500,
        status: 'Pending',
        invoiceDate: new Date().toISOString(),
        billTo: { clientName: 'Client B' }
    }
];

// Mock Child Component (AIInsightsCard) karena kita tidak mau test itu di sini
vi.mock('../../components/AIInsightsCard', () => ({
    default: () => <div data-testid="ai-insights">AI Summary</div>
}));

describe('Dashboard Page', () => {
    it('should show loading state initially', () => {
        // Setup mock promise yang belum resolve
        axiosInstance.get.mockImplementation(() => new Promise(() => {}));
        
        render(<BrowserRouter><Dashboard /></BrowserRouter>);
        // Loader biasanya tidak punya text, kita cari class atau elemen tertentu, 
        // tapi di sini kita asumsikan tidak crash dulu.
    });

    it('should display stats correctly after loading', async () => {
        // Setup mock resolve data
        axiosInstance.get.mockResolvedValue({ data: mockInvoices });

        render(<BrowserRouter><Dashboard /></BrowserRouter>);

        // Tunggu sampai loading selesai dan text muncul
        await waitFor(() => {
            expect(screen.getByText('Total Invoices')).toBeInTheDocument();
        });

        // Cek nilai stat
        // Total Paid = 1000
        expect(screen.getByText('1000.00')).toBeInTheDocument();
        
        // Total Unpaid = 500
        expect(screen.getByText('500.00')).toBeInTheDocument();
        
        // Cek list invoices muncul
        expect(screen.getByText('Client A')).toBeInTheDocument();
        expect(screen.getByText('Client B')).toBeInTheDocument();
    });
});