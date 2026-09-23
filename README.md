# Brim POS Portfolio Demo

A full-stack café point-of-sale demo. The React client calls an Express API, which stores products, categories, sales, and inventory in Supabase PostgreSQL.

## Run locally

1. Copy `server/.env.example` to `server/.env`.
2. Set `DATABASE_URL` to the Supabase PostgreSQL connection string.
3. Install dependencies and start the app:

```bash
npm install
npm run dev
```

The client runs at `http://localhost:5173`; the API runs at `http://localhost:5000/api`. The server loads `server/.env` when it starts.

## Data

The PostgreSQL schema is in `database/postgres/001_schema.sql`. A one-time importer copies the existing SQLite database into an empty Supabase database, preserving IDs, timestamps, sales, and inventory history:

```bash
npm run import:sqlite --workspace=server
```

The importer stops if the target tables already exist. The local SQLite file remains in `server/data/pos.sqlite` as the source copy. Set `SQLITE_PATH` if the source file is stored elsewhere.

## Checks

```bash
npm test
npm run build
```

The server tests use `DATABASE_URL` to create temporary isolated schemas, then drop them. They do not use the imported `public` tables.
