import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SalesHistory from './SalesHistory.jsx';

const sale = {
  id: 1,
  receipt_no: 'POS-20260914061356-1280',
  cashier_name: 'Portfolio Demo',
  payment_method: 'cash',
  subtotal: 145,
  discount: 0,
  total: 145,
  amount_received: 150,
  change_amount: 5,
  created_at: '2026-09-14T06:13:56.000Z'
};

vi.mock('../services/api.js', () => ({
  default: {
    get: vi.fn((url) => {
      if (url === '/sales') return Promise.resolve({ data: [sale] });
      return Promise.resolve({
        data: {
          ...sale,
          items: [
            {
              id: 1,
              product_name: 'Caramel Macchiato',
              quantity: 1,
              price: 145,
              total: 145
            }
          ]
        }
      });
    })
  }
}));

afterEach(() => {
  vi.clearAllMocks();
});

test('renders a system-style receipt when a sale is opened', async () => {
  render(
    <MemoryRouter>
      <SalesHistory />
    </MemoryRouter>
  );

  expect(await screen.findByText(sale.receipt_no)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'View receipt' }));

  expect(await screen.findByText('Receipt number')).toBeInTheDocument();
  expect(screen.getByText('Brim POS')).toBeInTheDocument();
  expect(screen.getByText('Thank you for your visit.')).toBeInTheDocument();
  expect(screen.getByText('Caramel Macchiato')).toBeInTheDocument();
});
