import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import POS from './POS.jsx';
import { CashierProvider } from '../context/CashierContext.jsx';

const sale = {
  id: 12,
  receipt_no: 'POS-20260914214500-1200',
  cashier_name: 'Portfolio Demo',
  payment_method: 'cash',
  subtotal: 120,
  discount: 0,
  total: 120,
  amount_received: 150,
  change_amount: 30,
  created_at: '2026-09-14T13:45:00.000Z',
  items: [{ id: 1, product_name: 'Cafe Latte', quantity: 1, price: 120, total: 120 }]
};

const apiMock = vi.hoisted(() => ({
  get: vi.fn((url) => {
    if (url === '/products') {
      return Promise.resolve({
        data: [{ id: 1, name: 'Cafe Latte', category_name: 'Coffee', price: 120, stock: 10, image_url: '' }]
      });
    }

    return Promise.resolve({ data: [] });
  }),
  post: vi.fn(() => Promise.resolve({ data: sale }))
}));

vi.mock('../services/api.js', () => ({ default: apiMock }));

afterEach(() => {
  vi.clearAllMocks();
});

test('opens the generated receipt with print action after checkout', async () => {
  render(
    <CashierProvider>
      <MemoryRouter>
        <POS />
      </MemoryRouter>
    </CashierProvider>
  );

  fireEvent.click(await screen.findByRole('button', { name: /Cafe Latte/ }));
  fireEvent.change(screen.getAllByRole('spinbutton')[1], { target: { value: '150' } });
  fireEvent.click(screen.getByRole('button', { name: 'Checkout' }));

  expect(await screen.findByRole('heading', { name: /Receipt POS-20260914214500-1200/ })).toBeInTheDocument();
  expect(document.querySelector('#receipt-print')).toHaveClass('receipt-enter');
  expect(screen.getByText('Thank you for your visit.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Print receipt' })).toBeInTheDocument();
  expect(apiMock.post).toHaveBeenCalledWith('/sales/checkout', expect.objectContaining({ cashier_name: 'Portfolio Demo' }));

  const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
  fireEvent.click(screen.getByRole('button', { name: 'Print receipt' }));
  expect(printSpy).toHaveBeenCalledOnce();
  printSpy.mockRestore();
});
