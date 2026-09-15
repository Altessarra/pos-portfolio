# Portfolio SQLite Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the POS a full-access portfolio demo backed by an automatically seeded, persistent local SQLite database.

**Architecture:** Express retains ownership of a file-based SQLite database and exposes the existing business endpoints without authentication. `server/config/db.js` initializes a configured SQLite file, while controllers use synchronous prepared statements inside their existing async Express handlers. The React client removes authentication and roles, renders a single unrestricted application shell, and labels activity as a portfolio demo.

**Tech Stack:** Node.js, Express 5, `better-sqlite3`, React 19, React Router 7, Vite, Node's built-in test runner, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-14-portfolio-sqlite-demo-design.md`

## Global Constraints

- The persistent production database path is `server/data/pos.sqlite`.
- `SQLITE_PATH` overrides the database path only for local development and automated tests.
- The first open creates the SQLite schema and seeds four categories and seven products; later opens do not overwrite data.
- Public APIs remain under `/api` and require no token or role.
- Sales and inventory logs return `Portfolio Demo` for legacy cashier/operator display fields.
- No PostgreSQL, JWT, bcrypt, cookie-parser, or user-account code remains in runtime dependencies.
- Tests use isolated temporary SQLite files and must never modify `server/data/pos.sqlite`.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `server/config/db.js` | Open SQLite, create parent directories, enable foreign keys, initialize schema and demo seed data, and export the database connection. |
| `database/schema.sql` | SQLite DDL and first-run category/product seed statements. |
| `server/app.js` | Construct the configured Express application without binding a TCP port, enabling API integration tests. |
| `server/server.js` | Start the `app` exported from `server/app.js`. |
| `server/controllers/*.js` | Execute SQLite-compatible queries, preserve HTTP payloads, and maintain atomic checkout and inventory updates. |
| `server/routes/*.js` | Expose business routes directly, with no authentication middleware. |
| `server/tests/helpers/apiServer.js` | Start/stop an isolated app and generate a test-only SQLite path. |
| `server/tests/*.test.js` | Exercise first-run initialization, public API behavior, checkout atomicity, and persistence. |
| `client/src/routes/AppRoutes.jsx` | Route every portfolio page through `MainLayout`, with direct navigation and no Login/ProtectedRoute dependency. |
| `client/src/main.jsx` | Render the router and application without `AuthProvider`. |
| `client/src/components/{Sidebar,Topbar}.jsx` | Render all navigation links and portfolio-demo copy, with no account or logout controls. |
| `client/src/routes/AppRoutes.test.jsx` | Verify `/login` and `/` lead to the unrestricted dashboard shell. |
| `client/src/test/setup.js` | Load Testing Library DOM matchers for Vitest route assertions. |
| `README.md`, `DEPLOYMENT.md` | Explain zero-configuration local SQLite usage and reset behavior. |

### Task 1: Establish a self-initializing SQLite database

**Files:**
- Create: `server/tests/database.test.js`
- Modify: `server/package.json`
- Modify: `server/config/db.js`
- Modify: `database/schema.sql`

**Interfaces:**
- Consumes: `process.env.SQLITE_PATH` as an optional absolute test database path.
- Produces: `default db`, a `better-sqlite3` database instance supporting `prepare(sql).get(...params)`, `all(...params)`, `run(...params)`, `transaction(fn)`, and `close()`.

- [ ] **Step 1: Add a test that requires first-run SQLite initialization without PostgreSQL environment values.**

```js
// server/tests/database.test.js
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('creates, seeds, and reopens the configured SQLite database without credentials', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'pos-db-'));
  const databasePath = path.join(directory, 'portfolio.sqlite');
  const program = `
    const { default: first } = await import('./server/config/db.js?first');
    const seeded = first.prepare('SELECT COUNT(*) AS count FROM products').get().count;
    first.prepare("UPDATE products SET stock = 39 WHERE sku = 'COF-001'").run();
    first.close();
    const { default: second } = await import('./server/config/db.js?second');
    const stock = second.prepare("SELECT stock FROM products WHERE sku = 'COF-001'").get().stock;
    second.close();
    process.stdout.write(JSON.stringify({ seeded, stock }));
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', program], {
    cwd: process.cwd(),
    env: { ...process.env, SQLITE_PATH: databasePath, DATABASE_URL: '' }
  });

  assert.equal(existsSync(databasePath), true);
  assert.equal(result.status, 0, result.stderr.toString());
  assert.deepEqual(JSON.parse(result.stdout.toString()), { seeded: 7, stock: 39 });
  rmSync(directory, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run the database test to verify the existing PostgreSQL configuration fails the expected assertion.**

Run: `node --test server/tests/database.test.js`

Expected: FAIL because `server/config/db.js` requires `DATABASE_URL`, so the child process exits non-zero instead of the asserted `0`.

- [ ] **Step 3: Replace the server database dependency and write the SQLite schema.**

Run: `npm install --workspace=server better-sqlite3 && npm uninstall --workspace=server pg bcryptjs jsonwebtoken cookie-parser`

Replace `database/schema.sql` with SQLite definitions for `categories`, `products`, `sales`, `sale_items`, and `inventory_logs`. Store booleans as `INTEGER NOT NULL DEFAULT 1`, use `INTEGER PRIMARY KEY`, retain foreign keys and validation checks, and remove all `users` and `user_id` columns. Include the existing four categories and seven products in `INSERT OR IGNORE` seed statements.

Implement `server/config/db.js` so the minimum behavior is:

```js
const databasePath = process.env.SQLITE_PATH || path.resolve(__dirname, '../data/pos.sqlite');
mkdirSync(path.dirname(databasePath), { recursive: true });
const db = new Database(databasePath);
db.pragma('foreign_keys = ON');
db.exec(readFileSync(path.resolve(__dirname, '../../database/schema.sql'), 'utf8'));
export default db;
```

Use `fileURLToPath(import.meta.url)` to derive `__dirname`. Do not load or require a database URL, SSL setting, or credentials.

- [ ] **Step 4: Run the database test to verify it passes.**

Run: `node --test server/tests/database.test.js`

Expected: PASS; the test-created database exists and contains exactly seven seeded products.

- [ ] **Step 5: Commit the database foundation.**

```bash
git add server/package.json package-lock.json server/config/db.js database/schema.sql server/tests/database.test.js
git commit -m "feat: initialize portfolio SQLite database"
```

### Task 2: Make the Express API public and testable

**Files:**
- Create: `server/app.js`
- Create: `server/tests/helpers/apiServer.js`
- Create: `server/tests/public-api.test.js`
- Modify: `server/server.js`
- Modify: `server/routes/dashboardRoutes.js`
- Modify: `server/routes/categoryRoutes.js`
- Modify: `server/routes/productRoutes.js`
- Modify: `server/routes/inventoryRoutes.js`
- Modify: `server/routes/saleRoutes.js`
- Modify: `server/routes/reportRoutes.js`
- Delete: `server/routes/authRoutes.js`
- Delete: `server/routes/userRoutes.js`
- Delete: `server/middleware/authMiddleware.js`
- Delete: `server/controllers/authController.js`
- Delete: `server/controllers/userController.js`

**Interfaces:**
- Consumes: The SQLite connection from Task 1 and existing controller exports.
- Produces: `createApp()` in `server/app.js`, returning an Express app that serves each retained `/api/*` route without `Authorization`.

- [ ] **Step 1: Add a failing integration test for unauthenticated dashboard access.**

```js
// server/tests/public-api.test.js
import assert from 'node:assert/strict';
import test from 'node:test';
import { startApiServer } from './helpers/apiServer.js';

test('serves dashboard data without an authorization header', async (t) => {
  const server = await startApiServer();
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
```

`startApiServer()` must set a unique `SQLITE_PATH` before importing `createApp`, call `app.listen(0)`, return `{ url, close }`, and close the listener and test-only database file in `close()`.

- [ ] **Step 2: Run the integration test to verify the current API rejects a request without a bearer token.**

Run: `node --test server/tests/public-api.test.js`

Expected: FAIL with `401` instead of the asserted `200`.

- [ ] **Step 3: Split application construction from startup and remove authentication and role gates.**

Move Express middleware, health routes, retained business route registration, production static-file handling, and error middleware from `server/server.js` into `createApp()` in `server/app.js`. Remove the now-unused cookie-parser import and middleware. Reduce `server/server.js` to import `createApp`, create the app, and listen on `process.env.PORT || 5000`.

For every retained router, remove `protect` and `authorize` imports and register the same methods and paths directly, for example:

```js
router.get('/', getProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', archiveProduct);
```

Do not register `/api/auth` or `/api/users`. Delete the obsolete authentication and user source files listed above.

- [ ] **Step 4: Run the public API test to verify unrestricted access.**

Run: `node --test server/tests/public-api.test.js`

Expected: PASS with a `200` dashboard response and no authorization header.

- [ ] **Step 5: Commit public API routing.**

```bash
git add server/app.js server/server.js server/routes server/tests/public-api.test.js server/tests/helpers/apiServer.js
git add -u server/controllers server/middleware server/routes
git commit -m "feat: expose POS API without authentication"
```

### Task 3: Port business queries and protect checkout integrity

**Files:**
- Create: `server/tests/checkout.test.js`
- Modify: `server/controllers/categoryController.js`
- Modify: `server/controllers/productController.js`
- Modify: `server/controllers/inventoryController.js`
- Modify: `server/controllers/saleController.js`
- Modify: `server/controllers/dashboardController.js`
- Modify: `server/controllers/reportController.js`

**Interfaces:**
- Consumes: `db` from Task 1 and `startApiServer()` from Task 2.
- Produces: SQLite-backed endpoints whose JSON payload field names match the current client expectations, including `cashier_name: 'Portfolio Demo'` and `user_name: 'Portfolio Demo'` where those legacy fields are returned.

- [ ] **Step 1: Add a failing checkout test that asserts a sale, stock deduction, inventory log, and persistence.**

```js
// server/tests/checkout.test.js
import assert from 'node:assert/strict';
import test from 'node:test';
import { startApiServer } from './helpers/apiServer.js';

test('checkout records a Portfolio Demo sale and deducts stock atomically', async (t) => {
  const server = await startApiServer();
  t.after(() => server.close());

  const before = await fetch(`${server.url}/api/products`).then((response) => response.json());
  const americano = before.find((product) => product.sku === 'COF-001');
  const response = await fetch(`${server.url}/api/sales/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ product_id: americano.id, quantity: 2 }],
      payment_method: 'cash',
      amount_received: 200
    })
  });
  const sale = await response.json();
  const after = await fetch(`${server.url}/api/products`).then((result) => result.json());
  const logs = await fetch(`${server.url}/api/inventory/logs`).then((result) => result.json());

  assert.equal(response.status, 201);
  assert.equal(sale.cashier_name, 'Portfolio Demo');
  assert.equal(after.find((product) => product.id === americano.id).stock, americano.stock - 2);
  assert.equal(logs[0].user_name, 'Portfolio Demo');
});
```

- [ ] **Step 2: Run the checkout test to verify PostgreSQL-specific queries fail under SQLite.**

Run: `node --test server/tests/checkout.test.js`

Expected: FAIL because controller queries still use PostgreSQL syntax such as `$1`, `ILIKE`, `RETURNING`, `ANY`, casts, and `FOR UPDATE`.

- [ ] **Step 3: Convert all controller data access to SQLite prepared statements and transactions.**

Use `db.prepare(sql).all(...params)` for collection reads, `get(...params)` for one row, and `run(...params)` for writes. Replace each positional `$n` parameter with `?`; replace `ILIKE` with `LIKE`; replace boolean conditions with `is_active = 1`; replace PostgreSQL date casts with `DATE(created_at)`; and replace `TO_CHAR(created_at, 'YYYY-MM')` with `strftime('%Y-%m', created_at)`.

For inserts and updates, fetch the changed row after `run()` with its `lastInsertRowid` or request id. Implement checkout with one `db.transaction(() => { ... })` callback. It must read all requested products, validate each active product and its available stock, insert the sale, add every line item, decrement each product, add inventory logs without `user_id`, and return the full sale. Add the display field with:

```js
const portfolioOperator = 'Portfolio Demo';
return { ...sale, cashier_name: portfolioOperator, items };
```

Add the same constant as `user_name` to inventory-log read results. Use `Number(...)` for totals, count fields, price calculations, and stock changes before JSON serialization.

- [ ] **Step 4: Run checkout and public API tests to verify all retained flows work with SQLite.**

Run: `node --test server/tests/public-api.test.js server/tests/checkout.test.js`

Expected: PASS; checkout returns `201`, stock decreases by two, and the latest sale and inventory log identify `Portfolio Demo`.

- [ ] **Step 5: Add and run a rollback assertion for insufficient stock.**

Extend `server/tests/checkout.test.js` with a request exceeding `COF-001` stock. Assert a non-`201` response and assert the product stock is unchanged after the request.

Run: `node --test server/tests/checkout.test.js`

Expected: PASS; no sale, item, stock, or log entry is retained for the rejected checkout.

- [ ] **Step 6: Commit SQLite controller migration.**

```bash
git add server/controllers server/tests/checkout.test.js
git commit -m "feat: persist POS operations in SQLite"
```

### Task 4: Remove authentication and role UI from the React application

**Files:**
- Create: `client/src/routes/AppRoutes.test.jsx`
- Modify: `client/package.json`
- Modify: `client/vite.config.js`
- Modify: `client/src/main.jsx`
- Modify: `client/src/routes/AppRoutes.jsx`
- Modify: `client/src/services/api.js`
- Modify: `client/src/components/Sidebar.jsx`
- Modify: `client/src/components/Topbar.jsx`
- Delete: `client/src/context/AuthContext.jsx`
- Delete: `client/src/routes/ProtectedRoute.jsx`
- Delete: `client/src/pages/Login.jsx`
- Delete: `client/src/pages/Users.jsx`

**Interfaces:**
- Consumes: Public API endpoints from Tasks 2 and 3.
- Produces: An unrestricted React route tree that routes `/`, `/login`, and unknown paths to `/dashboard` and renders all remaining portfolio pages beneath `MainLayout`.

- [ ] **Step 1: Add a failing browser-route test for direct dashboard access.**

Install the test-only client dependencies:

```bash
npm install --workspace=client --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom
```

Add the Vite `test` configuration with `environment: 'jsdom'` and `setupFiles: './src/test/setup.js'`. In `client/src/routes/AppRoutes.test.jsx`, render `AppRoutes` inside `MemoryRouter` with `initialEntries={['/login']}` and assert that the dashboard heading appears and the login form does not:

```jsx
expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the route test to verify the existing `/login` route renders the login page.**

Run: `npm run test --workspace=client -- --run client/src/routes/AppRoutes.test.jsx`

Expected: FAIL because `/login` renders `Login` and not the dashboard.

- [ ] **Step 3: Remove client authentication and render the portfolio shell directly.**

Remove `AuthProvider` from `client/src/main.jsx`. In `AppRoutes`, delete Login, ProtectedRoute, RoleHome, role groups, and Users. Put every retained page under `MainLayout`; redirect `/`, `/login`, and `*` to `/dashboard`.

Remove axios request and 401 response interceptors from `client/src/services/api.js`. In `Sidebar`, remove `useAuth`, role filtering, account panel, `LogOut`, and the logout button; render the complete retained navigation list. In `Topbar`, remove `useAuth` and replace the greeting with `Portfolio demo` and the subtitle `Full-access local POS preview`.

- [ ] **Step 4: Run the client route test to verify login is unreachable and dashboard access is direct.**

Run: `npm run test --workspace=client -- --run client/src/routes/AppRoutes.test.jsx`

Expected: PASS; visiting `/login` displays the dashboard layout and no email field.

- [ ] **Step 5: Build the client and commit the UI change.**

Run: `npm run build --workspace=client`

Expected: Vite completes with a generated `client/dist` bundle and no unresolved Auth, Login, Users, or ProtectedRoute imports.

```bash
git add client/package.json package-lock.json client/vite.config.js client/src
git add -u client/src
git commit -m "feat: open POS as an unrestricted portfolio demo"
```

### Task 5: Document local operation and perform end-to-end verification

**Files:**
- Modify: `README.md`
- Modify: `DEPLOYMENT.md`
- Modify: `server/package.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: Final server scripts, automatic SQLite initialization, and unrestricted client routes.
- Produces: Clear developer instructions for running, persisting, and resetting the portfolio demo.

- [ ] **Step 1: Add a server test script and run the full automated suite.**

Set `server/package.json` scripts to include:

```json
"test": "node --test tests/*.test.js"
```

Run: `npm run test --workspace=server && npm run test --workspace=client -- --run && npm run build`

Expected: all server tests, client route tests, and the production client build pass.

- [ ] **Step 2: Rewrite setup and deployment guidance for a local database.**

In `README.md` and `DEPLOYMENT.md`, remove all PostgreSQL, connection-string, SSL, JWT, account, and password instructions. State that `npm install` and `npm run dev` are sufficient, data is persisted to `server/data/pos.sqlite`, `SQLITE_PATH` may select another local file, and deleting `server/data/pos.sqlite` resets the sample data on the next server start.

- [ ] **Step 3: Run the final smoke test against the production build.**

Run: `npm run build && node --test server/tests/database.test.js server/tests/public-api.test.js server/tests/checkout.test.js`

Expected: PASS; SQLite initializes without environment credentials, public APIs return data, checkout adjusts stock and writes an operator label, and the built client compiles.

- [ ] **Step 4: Review the working tree and commit documentation.**

Run: `git diff --check && git status --short`

Expected: no whitespace errors and only the intended documentation and script changes remain unstaged.

```bash
git add README.md DEPLOYMENT.md server/package.json package-lock.json
git commit -m "docs: explain local SQLite portfolio setup"
```
