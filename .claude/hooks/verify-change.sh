#!/usr/bin/env bash
# PostToolUse (Edit|Write): typecheck + lint right after every source edit.
#
# Why immediately and not at the end: the error arrives while the file is still
# fresh in the model's context. End-of-session feedback is feedback about code
# the agent has already stopped thinking about.
#
# Exit 0 = fine (stdout hidden from the model — hooks stay quiet on success).
# Exit 2 = BLOCKING: stderr is fed back to Claude, which must fix it now.
set -uo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# The matcher filters by TOOL, not by file. Filtering by path is our job:
# running tsc because someone edited the README is how hooks get disabled.
case "$FILE" in
  */server/src/*|*/server/test/*|*/server/scripts/*) ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}/server" || exit 0

TSC_OUT=$(npx tsc --noEmit 2>&1)
if [ -n "$TSC_OUT" ]; then
  # Actionable: the real error text, trimmed. Never just "checks failed".
  echo "Typecheck failed after editing $FILE:" >&2
  echo "$TSC_OUT" | head -40 >&2
  exit 2
fi

LINT_OUT=$(npx eslint src test 2>&1)
if echo "$LINT_OUT" | grep -qE "[0-9]+ error"; then
  echo "Lint failed after editing $FILE:" >&2
  echo "$LINT_OUT" | head -40 >&2
  exit 2
fi

exit 0
