# Ticketflow

Support-desk app. Express + Postgres API in `server/`, React Router v8 framework
mode in `web/`.

## Commands

- `npm run typecheck` | `npm run lint` | `npm test` — run all three before declaring any task done
- `npm run db:migrate --workspace server` — applies `server/migrations/*.sql` in filename order
- Postgres runs on port **5433** (docker compose), NOT 5432
- Tests are DB-free unit tests (vitest). Never require a live DB in unit tests.

## Conventions

- All data access goes through `server/src/services/`. Raw SQL in route files is
  legacy; do not add more (cleanup tracked as BACKLOG T5).
- Request validation: zod schemas — `routes/customers.ts` is the canonical
  example. The manual checks in `routes/tickets.ts` are the old style; do not
  imitate. Parameterized SQL only (`$1, $2, …`), never string interpolation.
- Migrations: `server/migrations/NNN-description.sql`, strictly sequential, never
  edit an applied migration. Enum-like columns get CHECK constraints; new FK
  columns get indexes; use TIMESTAMPTZ.
- API responses: raw rows today. **Do not invent envelope formats** — `web/app/api.ts`
  consumes these shapes and TypeScript will not catch the break.

## Traps

- "agents" throughout this codebase = **human support staff**, not AI agents.
- `server/src/legacy/` is frozen. Never extend it or import it in new code.
- Ticket status transitions are defined ONLY in `ticketService.TRANSITIONS`.
  Route handlers must not implement their own transition logic.
- Support staff can be `active = false` (soft delete). Any query joining `agents`
  must decide explicitly how to treat inactive staff.

## Architecture

- `server/src/routes/` HTTP only · `server/src/services/` data access ·
  `server/migrations/` schema · `server/test/` vitest · `web/app/routes/` UI
- Open tasks: `BACKLOG.md`. Don't invent scope beyond the task you were given.
