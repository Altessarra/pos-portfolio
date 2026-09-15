import assert from 'node:assert/strict';
import test from 'node:test';
import { startApiServer } from './helpers/apiServer.js';

test('checkout stores the selected cashier name on the sale', async (t) => {
  const server = await startApiServer();
  assert.equal(server.startupError, undefined, server.startupError?.message);
  t.after(() => server.close());

  const products = await fetch(`${server.url}/api/products`).then((response) => response.json());
  const americano = products.find((product) => product.sku === 'COF-001');

  const checkoutResponse = await fetch(`${server.url}/api/sales/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ product_id: americano.id, quantity: 1 }],
      payment_method: 'cash',
      amount_received: 200,
      cashier_name: 'Mia Santos'
    })
  });
  const sale = await checkoutResponse.json();

  assert.equal(checkoutResponse.status, 201);
  assert.equal(sale.cashier_name, 'Mia Santos');

  const sales = await fetch(`${server.url}/api/sales`).then((response) => response.json());
  assert.equal(sales[0].cashier_name, 'Mia Santos');

  const detail = await fetch(`${server.url}/api/sales/${sale.id}`).then((response) => response.json());
  assert.equal(detail.cashier_name, 'Mia Santos');
});
