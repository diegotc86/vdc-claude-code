---
description: Fix a Ticketflow backlog task end-to-end
---

Fix backlog task $ARGUMENTS from BACKLOG.md.

1. Read the task and restate it as concrete acceptance criteria. List every file
   you expect to touch. If the task is ambiguous, state your assumption
   explicitly **before** writing code — do not silently pick one reading.
2. Search for related tests before changing anything.
3. Implement it following our conventions (CLAUDE.md; load the `new-endpoint`
   skill if this adds or changes an endpoint).
4. Run typecheck, lint, and tests. Fix what breaks.
5. Summarize: each acceptance criterion → how it is met → how it is verified.
