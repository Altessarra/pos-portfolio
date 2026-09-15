# Deployment Guide

CafePOS is designed as a self-contained portfolio demo. The Express server serves the built React application and stores its data in a local SQLite file.

## Build and start

```bash
npm install
npm run build
npm start
```

The server listens on port `5000` by default. Set `PORT` only if your host provides a different port.

## Persistent storage

SQLite data is stored at `server/data/pos.sqlite`. A deployment must provide a writable, persistent disk at that location if sales and inventory changes should survive restarts or redeployments.

If the host uses ephemeral storage, the POS still runs, but it resets to the seeded sample catalog whenever that storage is replaced. You can set `SQLITE_PATH` to a different writable persistent path when your host requires it.

## Health check

Use the following endpoint for a basic health check:

```text
/api/health
```

There are no database credentials, JWT secrets, login accounts, or third-party database services to configure.
