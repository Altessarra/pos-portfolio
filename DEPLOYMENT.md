# Deployment Guide

This project is now deployment-ready as a single full-stack app.

The backend serves the built React frontend in production.

## Local development

From the project root:

```bash
npm install
```

Create:

```bash
server/.env
```

Use:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=pos_system

DB_SSL=false

JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
```

Run:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5000/api
```

## Production deployment

Use these commands on your hosting provider.

### Build command

```bash
npm install && npm run build
```

### Start command

```bash
npm start
```

## Required production environment variables

```env
NODE_ENV=production
PORT=5000

CLIENT_URL=https://your-deployed-domain.com

DATABASE_URL=postgresql://username:password@host:5432/database_name
DB_SSL=true

JWT_SECRET=your_very_long_random_secret
JWT_EXPIRES_IN=7d
```

## PostgreSQL setup

Create your hosted PostgreSQL database first.

Then run the schema:

```bash
psql "your_DATABASE_URL_here" -f database/schema.sql
```

If your provider requires SSL for `psql`, use:

```bash
psql "your_DATABASE_URL_here?sslmode=require" -f database/schema.sql
```

## Default seeded accounts

```text
Admin: admin@pos.com / admin123
Manager: manager@pos.com / admin123
Cashier: cashier@pos.com / admin123
```

Change these passwords after deployment.

## Important production notes

1. Use a hosted PostgreSQL database.
2. Set `DB_SSL=true` for hosted PostgreSQL if required.
3. Do not commit your real `.env` file.
4. Set `CLIENT_URL` to your deployed app URL.
5. The frontend uses `/api`, so it works when React is served by Express.
6. Health check endpoint:

```text
/api/health
```

## Common deployment values

For a single Render/Railway-style web service:

```text
Build Command: npm install && npm run build
Start Command: npm start
Root Directory: fullstack-pos-system, if your repo contains a parent folder
```

If your repository root is already `fullstack-pos-system`, leave Root Directory blank.
