import assert from 'node:assert/strict';
import test from 'node:test';
import { startApiServer } from './helpers/apiServer.js';

test('serves dashboard data without an authorization header', async (t) => {
  const server = await startApiServer();

  assert.equal(server.startupError, undefined, server.startupError?.message);
  t.after(() => server.close());

  const response = await fetch(`${server.url}/api/dashboard`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    todaySales: 0,
    totalOrders: 0,
    lowStockProducts: [],
    topSellingProducts: []
  });
});
