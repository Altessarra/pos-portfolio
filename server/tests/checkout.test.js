import assert from 'node:assert/strict';
import test from 'node:test';
import { startApiServer } from './helpers/apiServer.js';

test('checkout records a Portfolio Demo sale and deducts stock atomically', async (t) => {
  const server = await startApiServer();
  assert.equal(server.startupError, undefined, server.startupError?.message);
  t.after(() => server.close());

  const productsResponse = await fetch(`${server.url}/api/products`);
  assert.equal(productsResponse.status, 200);
  const products = await productsResponse.json();
  const americano = products.find((product) => product.sku === 'COF-001');

  const checkoutResponse = await fetch(`${server.url}/api/sales/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ product_id: americano.id, quantity: 2 }],
      payment_method: 'cash',
      amount_received: 200
    })
  });
  const sale = await checkoutResponse.json();

  const updatedProductsResponse = await fetch(`${server.url}/api/products`);
  assert.equal(updatedProductsResponse.status, 200);
  const updatedProducts = await updatedProductsResponse.json();

  const logsResponse = await fetch(`${server.url}/api/inventory/logs`);
  assert.equal(logsResponse.status, 200);
  const logs = await logsResponse.json();

  assert.equal(checkoutResponse.status, 201);
  assert.equal(sale.cashier_name, 'Portfolio Demo');
  assert.equal(updatedProducts.find((product) => product.id === americano.id).stock, americano.stock - 2);
  assert.equal(logs[0].user_name, 'Portfolio Demo');

  const rejectedCheckout = await fetch(`${server.url}/api/sales/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ product_id: americano.id, quantity: 999 }],
      payment_method: 'cash',
      amount_received: 100000
    })
  });
  assert.notEqual(rejectedCheckout.status, 201);

  const finalProducts = await fetch(`${server.url}/api/products`).then((response) => response.json());
  assert.equal(finalProducts.find((product) => product.id === americano.id).stock, americano.stock - 2);
});
