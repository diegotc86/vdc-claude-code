#!/usr/bin/env bash
# Stop hook: the completion gate. No session ends with red checks.
#
# This is the difference between a CLAUDE.md line that says "run the tests"
# and a system in which not running them is not an available option.
set -uo pipefail

INPUT=$(cat)

# Loop guard: stop_hook_active is true when Claude is already continuing
# BECAUSE of this hook. If the failure persists, let the session end and report
# instead of ping-ponging forever.
if [ "$(echo "$INPUT" | jq -r '.stop_hook_active // false')" = "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}/server" || exit 0

OUT=$(npx tsc --noEmit 2>&1 && npx eslint src test 2>&1 && npx vitest run 2>&1)
STATUS=$?

if [ $STATUS -ne 0 ]; then
  # decision:block sends `reason` back to Claude, which must keep working.
  jq -n --arg reason "Completion gate failed — the session cannot end until these pass:

$(echo "$OUT" | tail -30)" '{decision: "block", reason: $reason}'
  exit 0
fi

exit 0
