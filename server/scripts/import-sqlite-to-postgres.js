import Database from 'better-sqlite3';
import postgres from 'postgres';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlitePath = process.env.SQLITE_PATH || path.resolve(__dirname, '../data/pos.sqlite');
const schemaPath = path.resolve(__dirname, '../../database/postgres/001_schema.sql');
const tables = ['categories', 'products', 'sales', 'sale_items', 'inventory_logs'];
const booleanColumns = {
  categories: ['is_active'],
  products: ['is_active']
};
const timestampColumns = {
  categories: ['created_at', 'updated_at'],
  products: ['created_at', 'updated_at'],
  sales: ['created_at'],
  inventory_logs: ['created_at']
};

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Set it in the server environment.');
}

const sqlite = new Database(sqlitePath, { readonly: true, fileMustExist: true });
const sql = postgres(process.env.DATABASE_URL, { max: 1 });

function asTimestamp(value) {
  if (value == null) return value;
  if (value instanceof Date) return value;

  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  const timestamp = new Date(normalized);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`Cannot convert SQLite timestamp: ${value}`);
  }
  return timestamp;
}

function transformRow(table, row) {
  const transformed = { ...row };

  for (const column of booleanColumns[table] || []) {
    transformed[column] = Boolean(transformed[column]);
  }

  for (const column of timestampColumns[table] || []) {
    transformed[column] = asTimestamp(transformed[column]);
  }

  return transformed;
}

try {
  const sourceRows = Object.fromEntries(
    tables.map(table => [table, sqlite.prepare(`SELECT * FROM ${table} ORDER BY id`).all().map(row => transformRow(table, row))])
  );
  const sourceCounts = Object.fromEntries(tables.map(table => [table, sourceRows[table].length]));
  const existing = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('categories', 'products', 'sales', 'sale_items', 'inventory_logs')
  `;

  if (existing.length) {
    throw new Error(`Import stopped because target tables already exist: ${existing.map(row => row.table_name).join(', ')}`);
  }

  const schema = readFileSync(schemaPath, 'utf8');
  const statements = schema.split(';').map(statement => statement.trim()).filter(Boolean);

  await sql.begin(async transaction => {
    for (const statement of statements) {
      await transaction.unsafe(statement);
    }

    for (const table of tables) {
      const rows = sourceRows[table];
      if (rows.length) {
        await transaction`INSERT INTO ${transaction(table)} ${transaction(rows)}`;
      }
    }

    for (const table of tables) {
      await transaction`
        SELECT setval(
          pg_get_serial_sequence(${`public.${table}`}, 'id'),
          GREATEST(COALESCE(MAX(id), 1), 1),
          COUNT(*) > 0
        )
        FROM ${transaction(table)}
      `;
    }

    for (const table of tables) {
      const [{ count }] = await transaction`SELECT COUNT(*)::INTEGER AS count FROM ${transaction(table)}`;
      if (Number(count) !== sourceCounts[table]) {
        throw new Error(`Import verification failed for ${table}: expected ${sourceCounts[table]}, received ${count}`);
      }
    }
  });

  console.log('SQLite import completed and row counts verified.');
  console.log(JSON.stringify(sourceCounts, null, 2));
} finally {
  sqlite.close();
  await sql.end();
}
