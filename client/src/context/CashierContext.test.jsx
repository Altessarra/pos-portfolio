import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import Topbar from '../components/Topbar.jsx';
import { CashierProvider } from './CashierContext.jsx';

beforeEach(() => {
  localStorage.clear();
});

test('lets the cashier update and persist the active name', () => {
  render(
    <CashierProvider>
      <Topbar />
    </CashierProvider>
  );

  expect(screen.getByText('Portfolio Demo')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Change cashier' }));

  const input = screen.getByRole('textbox', { name: 'Cashier name' });
  fireEvent.change(input, { target: { value: 'Mia Santos' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save cashier' }));

  expect(screen.getByText('Mia Santos')).toBeInTheDocument();
  expect(localStorage.getItem('brim-pos-cashier-name')).toBe('Mia Santos');
});
