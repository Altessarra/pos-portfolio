import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const databasePath = process.env.SQLITE_PATH || path.resolve(__dirname, '../data/pos.sqlite');
const schemaPath = path.resolve(__dirname, '../../database/schema.sql');

mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);

db.pragma('foreign_keys = ON');
db.exec(readFileSync(schemaPath, 'utf8'));

const salesColumns = db.pragma('table_info(sales)');
if (!salesColumns.some(column => column.name === 'cashier_name')) {
  db.exec("ALTER TABLE sales ADD COLUMN cashier_name TEXT NOT NULL DEFAULT 'Portfolio Demo'");
}

export default db;
