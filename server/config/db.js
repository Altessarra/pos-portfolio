import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force load server/.env
dotenv.config({
  path: path.resolve(__dirname, '../.env')
});

const databaseUrl = process.env.DATABASE_URL;
const useSsl = process.env.DB_SSL === 'true';

console.log('DATABASE_URL loaded:', databaseUrl ? 'YES' : 'NO');
console.log('DB_SSL:', process.env.DB_SSL);

if (!databaseUrl) {
  throw new Error('DATABASE_URL is missing. Check server/.env spelling and location.');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error', err);
});

export default pool;