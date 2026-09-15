import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes.jsx';

vi.mock('../services/api.js', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        todaySales: 482.5,
        totalOrders: 36,
        lowStockProducts: [
          {
            id: 1,
            name: 'Whole Bean Coffee',
            category_name: 'Beverages',
            stock: 3,
            image_url: 'https://example.test/whole-bean-coffee.jpg'
          }
        ],
        topSellingProducts: [
          { id: 1, name: 'Latte', sold: 32, revenue: 3840 }
        ]
      }
    })
  }
}));

vi.mock('recharts', () => {
  const Container = ({ children }) => <div>{children}</div>;

  return {
    Bar: () => null,
    BarChart: Container,
    CartesianGrid: () => null,
    ResponsiveContainer: Container,
    Tooltip: () => null,
    XAxis: () => null,
    YAxis: () => null
  };
});

afterEach(cleanup);

test('redirects the former login route to the unrestricted café dashboard', async () => {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AppRoutes />
    </MemoryRouter>
  );

  expect(await screen.findByRole('heading', { name: 'Good day' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Top-Selling Drinks' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Low Stock Items' })).toBeInTheDocument();
  expect(screen.getByText('Whole Bean Coffee')).toBeInTheDocument();
  expect(screen.queryByText('Portfolio demo')).not.toBeInTheDocument();
  expect(screen.queryByText('Full-access local POS preview')).not.toBeInTheDocument();
  expect(screen.queryByText('A portfolio project for café businesses.')).not.toBeInTheDocument();
  expect(screen.queryByText('Login to manage sales and inventory')).not.toBeInTheDocument();
});
