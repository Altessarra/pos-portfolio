import { existsSync, readFileSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');
if (existsSync(envPath)) loadEnvFile(envPath);

export async function startApiServer() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return { startupError: new Error('DATABASE_URL is required for API tests') };
  }

  const schemaName = 'brim_test_' + randomUUID().replaceAll('-', '');
  const originalSchema = process.env.DATABASE_SCHEMA;
  const admin = postgres(databaseUrl, { max: 1 });
  let client;
  let listener;

  try {
    await admin`CREATE SCHEMA ${admin(schemaName)}`;
    process.env.DATABASE_SCHEMA = schemaName;

    ({ client } = await import('../../config/postgres.js'));
    const schemaPath = path.resolve(__dirname, '../../../database/postgres/001_schema.sql');
    const statements = readFileSync(schemaPath, 'utf8')
      .split(';')
      .map(statement => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await client.unsafe(statement);
    }

    const [category] = await client.unsafe(
      "INSERT INTO categories (name, description) VALUES ('Coffee', 'Test category') RETURNING id"
    );
    await client.unsafe(
      'INSERT INTO products (category_id, name, sku, description, price, cost, stock, low_stock_threshold) ' +
        "VALUES ($1, 'Iced Americano', 'COF-001', 'Test product', 95, 35, 40, 8)",
      [category.id]
    );

    const { createApp } = await import('../../app.js?test=' + randomUUID());
    listener = createApp().listen(0);

    await new Promise((resolve, reject) => {
      listener.once('listening', resolve);
      listener.once('error', reject);
    });

    const { port } = listener.address();

    return {
      url: 'http://127.0.0.1:' + port,
      close: async () => {
        await new Promise(resolve => listener.close(resolve));
        await client.end();
        await admin`DROP SCHEMA ${admin(schemaName)} CASCADE`;
        await admin.end();
        if (originalSchema === undefined) delete process.env.DATABASE_SCHEMA;
        else process.env.DATABASE_SCHEMA = originalSchema;
      }
    };
  } catch (error) {
    if (listener) await new Promise(resolve => listener.close(resolve));
    if (client) await client.end();
    await admin`DROP SCHEMA IF EXISTS ${admin(schemaName)} CASCADE`;
    await admin.end();
    if (originalSchema === undefined) delete process.env.DATABASE_SCHEMA;
    else process.env.DATABASE_SCHEMA = originalSchema;
    return { startupError: error };
  }
}
