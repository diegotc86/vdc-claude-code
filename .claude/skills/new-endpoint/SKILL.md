---
name: new-endpoint
description: >
  How to add a new REST endpoint to the Ticketflow API — routing, zod
  validation, service-layer data access, tests, and the definition of done.
  Use when adding or substantially modifying API endpoints.
---

# Adding an endpoint to Ticketflow

## Checklist

1. **Route**: handler in `server/src/routes/<resource>.ts`. Routers hold HTTP
   concerns only — no SQL. A new resource means a new router file, registered in
   `src/index.ts` under `/api/<resource>`.
2. **Validation**: zod schema at the top of the route file, `safeParse`, failures
   → `400` with `parsed.error.flatten()`. `routes/customers.ts` POST is the
   canonical example — follow it exactly. Validate path params with
   `Number.isInteger` before touching the service. Numeric query params
   (`limit`, `offset`, `page`) need bounds, not just parsing: negatives and
   absurd values are a 400, not a database error.
3. **Data access**: exported async function in
   `server/src/services/<resource>Service.ts` using `query()` from `../db.js`.
   Parameterized SQL only (`$1, $2, …`) — never string interpolation, not even
   for numbers you just parsed.
4. **Tests**: table-driven vitest in `server/test/`, DB-free. Test service logic
   and validation; mock nothing you don't own.
5. **Done** = `npm run typecheck && npm run lint && npm test` green, plus the
   route listed in your PR description.

## Response conventions

- Collections: a raw array, newest first unless the resource has a natural order.
  **No envelopes** (`{data: ...}`) — `web/app/api.ts` consumes these shapes
  directly and TypeScript will not catch the break.
- Not found → `404 {"error": "not found"}`. Validation → `400`. Illegal state
  transition → `422`.

## Common mistakes

- Copying the manual validation style from `routes/tickets.ts` (legacy — it
  predates zod).
- Raw SQL in the route file "just this once". That is exactly how `tickets.ts`
  got the way it is.
- Re-implementing transition rules: they live ONLY in
  `ticketService.TRANSITIONS`.
- Joining `agents` without deciding what to do about `active = false` staff.

## Template

See [templates/route.ts.example](templates/route.ts.example) for a complete
new-resource router.
