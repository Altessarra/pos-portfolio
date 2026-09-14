# Portfolio POS: SQLite Demo Mode Design

## Purpose

Convert the POS into a self-contained portfolio demonstration. It must open directly into the application, retain its transactional POS behavior, and persist changes locally without PostgreSQL, credentials, or user accounts.

## Scope

- Replace the PostgreSQL driver and configuration with a local SQLite database at `server/data/pos.sqlite`.
- Create the database schema and demo seed data automatically when the server starts and the database does not yet exist.
- Preserve the current HTTP endpoints for dashboard, categories, products, inventory, sales, and reports.
- Remove login, JWT authentication, role-based access, user management, logout, and their unused dependencies.
- Treat all writes as made by the fixed display-only operator `Portfolio Demo`.
- Update local setup and deployment documentation for the dependency-free database setup.

## Architecture

The Express server remains the only owner of persistent data. A small database module opens the SQLite file, enables foreign keys, creates the schema, and seeds the existing product and category demo data on first use. Controllers use a narrow database adapter that exposes prepared-statement reads, writes, and transactions. This retains the current API contract while converting PostgreSQL placeholders, return clauses, date operations, and locking syntax to SQLite-compatible statements.

The client continues to call `/api`, but no longer sends an authorization header, stores credentials, renders a login page, or gates routes by role. The router opens the dashboard by default and exposes every remaining POS page under the shared application layout. The sidebar and top bar describe the app as a portfolio demo instead of an authenticated user session.

## Data model and behavior

SQLite keeps `categories`, `products`, `sales`, `sale_items`, and `inventory_logs`. User data is removed. `sales` and `inventory_logs` no longer reference a user; read endpoints return the constant `cashier_name` or `user_name` value `Portfolio Demo` where the existing UI expects it.

The first startup seeds four categories and seven products. After that, the SQLite file is left untouched by initialization: product edits, stock updates, sales, inventory logs, and report data survive server restarts. Deleting the local `server/data/pos.sqlite` file is the explicit way to reset the demonstration data.

Checkout remains atomic. A transaction verifies every requested product is active and has adequate stock, creates the sale and its line items, decrements stock, and creates matching inventory logs. If validation or any write fails, the transaction rolls back without changing inventory.

## Error handling

Existing Express error middleware remains responsible for API errors. SQLite constraint errors, missing entities, empty carts, insufficient stock, and underpayment continue to result in clear non-success responses. The initialization module fails fast with a contextual error if the database file cannot be opened or prepared.

## Testing and verification

Automated server tests will start against a temporary SQLite file and verify schema seeding, no-auth access to representative endpoints, successful checkout with stock and log changes, and data persistence after a database reopen. The client build will verify removal of obsolete imports and route compilation. A manual smoke test will cover direct loading, creating and editing catalog data, completing a sale, and seeing the resulting dashboard, history, inventory, and report values.

## Non-goals

- No multi-user access control or credential recovery.
- No cloud synchronization, hosted database, or production database migration.
- No automatic deletion or reset of portfolio data.
