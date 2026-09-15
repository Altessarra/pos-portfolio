import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('creates, seeds, and reopens the configured SQLite database without credentials', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'pos-db-'));
  const databasePath = path.join(directory, 'portfolio.sqlite');
  const originalSqlitePath = process.env.SQLITE_PATH;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  let first;
  let second;

  try {
    process.env.SQLITE_PATH = databasePath;
    process.env.DATABASE_URL = '';

    ({ default: first } = await import(`../config/db.js?first=${Date.now()}`));
    const seeded = first.prepare('SELECT COUNT(*) AS count FROM products').get().count;
    first.prepare("UPDATE products SET stock = 39 WHERE sku = 'COF-001'").run();
    first.close();
    first = undefined;

    ({ default: second } = await import(`../config/db.js?second=${Date.now()}`));
    const stock = second.prepare("SELECT stock FROM products WHERE sku = 'COF-001'").get().stock;

    assert.equal(existsSync(databasePath), true);
    assert.deepEqual({ seeded, stock }, { seeded: 7, stock: 39 });
  } finally {
    first?.close();
    second?.close();
    if (originalSqlitePath === undefined) delete process.env.SQLITE_PATH;
    else process.env.SQLITE_PATH = originalSqlitePath;
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    rmSync(directory, { recursive: true, force: true });
  }
});
