# Ticketflow

A support-desk app: Express + PostgreSQL API, React Router v8 (Framework Mode) frontend. Customers file tickets; support agents get assigned and resolve them.

## Setup

```bash
npm install
docker compose up -d            # Postgres 16 on port 5433
npm run db:migrate --workspace server
npm run db:seed --workspace server
npm run dev                     # API on :3001
npm run dev --workspace web     # web on :3000
```

Copy `server/.env.example` to `server/.env` first.

Verification commands:

```bash
npm run typecheck   # tsc across workspaces
npm run lint        # eslint (server)
npm test            # vitest unit tests (no DB needed)
```

## Structure

```
server/
  src/index.ts            Express bootstrap
  src/db.ts               pg pool
  src/routes/             tickets.ts, customers.ts, agents.ts
  src/services/           ticketService.ts
  src/legacy/             ticketUtils.cjs — deprecated, do not extend
  migrations/             numbered SQL files, applied in order by db:migrate
  test/                   vitest
web/
  app/routes/             React Router v8 framework-mode routes
```

## The backlog

[`BACKLOG.md`](BACKLOG.md) lists the open tasks for the app.
