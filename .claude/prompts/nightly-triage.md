The nightly test job failed. Your task:

1. Run `npm run typecheck && npm run lint && npm test` and read the failures.
2. Diagnose the root cause of each one and classify it:
   - **MECHANICAL**: broken import, stale snapshot, type error from a rename,
     missing await, flaky timing.
   - **SUBSTANTIVE**: a behavior or logic question a human must decide.
3. For MECHANICAL failures: create branch `fix/nightly-<YYYY-MM-DD>`, fix them,
   verify all checks are green, and commit with a message explaining cause → fix.
4. For SUBSTANTIVE failures: do NOT change code. Write `triage-report.md` at the
   repo root with the failing test, the root-cause analysis, and the options with
   their trade-offs.
5. Never modify a test to make it pass unless the test itself is demonstrably
   wrong — and if you do, say so explicitly in the commit message.

Finish with a summary: what failed, how you classified it, what you did.
