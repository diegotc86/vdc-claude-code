# Ticketflow web (React Router v8, framework mode)

- Loaders call the API only via `app/api.ts`. Convention decision: fetchers
  **throw** on failure; 404 handling belongs in the loader (`throw new Response`).
  `fetchTicket`'s return-null style is legacy — migrate call sites when you touch
  them.
- `npm run typecheck --workspace web` runs `react-router typegen` first. Route
  types under `.react-router/` are generated: never edit or import them directly,
  only via `./+types/<route>`.
- Routes are registered explicitly in `app/routes.ts` — not file-system routing.
