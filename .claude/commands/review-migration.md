---
description: Review a migration file against Ticketflow conventions
---

Review the migration file $ARGUMENTS against these rules. Report each as
pass/fail with specifics — file:line, not adjectives.

1. Filename: `NNN-description.sql`, strictly sequential with the existing files
   in `server/migrations/` (no gaps, no duplicates).
2. Immutability: `git diff main -- server/migrations/` shows no changes to any
   previously existing migration file.
3. Enum-like TEXT columns have CHECK constraints.
4. New foreign-key columns have indexes.
5. Timestamps are TIMESTAMPTZ, never TIMESTAMP.
6. Destructive operations (DROP, ALTER TYPE, data rewrites) carry a
   justification comment in the file, and a note on how to roll back.
7. NOT NULL additions have a default or a backfill plan.

Verdict: APPROVE or REQUEST CHANGES.
