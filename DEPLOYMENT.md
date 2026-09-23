# Deployment Guide

Brim POS serves the built React client from the Express server. Product and sales data are stored in Supabase PostgreSQL.

## Build and start

```bash
npm install
npm run build
npm start
```

The server listens on port `5000` by default. Set `PORT` and `CLIENT_URL` to match the hosting environment.

## Environment

Set `DATABASE_URL` on the server to the Supabase PostgreSQL connection string. Keep it in the backend environment; never expose it in a `VITE_*` client variable or commit it to Git.

For local development, copy `server/.env.example` to `server/.env`. Production hosts should inject the environment variables directly.

## Database migration

The schema is in `database/postgres/001_schema.sql`. The existing SQLite records were copied to the configured Supabase database. Keep the SQLite file as a local backup until you have confirmed the deployed app reads the migrated records.

This is a portfolio demo and its API currently has no login or user permissions. Do not use it for real customer or business data without adding access control.
