#!/usr/bin/env bash
# PreToolUse (Edit|Write): deny edits to frozen paths and applied migrations.
#
# Defense in depth next to the permissions.deny rules in settings.json — but
# note what this can do that a bare deny rule can't: explain WHAT TO DO INSTEAD.
# A denial without an alternative just produces flailing.
set -uo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$FILE" ] && exit 0

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

case "$FILE" in
  */server/src/legacy/*)
    deny "server/src/legacy/ is frozen (see its README). If the task requires changing this behavior, inline the function you need into server/src/services/ticketService.ts and leave legacy/ untouched."
    ;;
esac

# Applied migrations are immutable: only the newest .sql file may still change.
case "$FILE" in
  */server/migrations/*.sql)
    DIR=$(dirname "$FILE")
    NEWEST=$(ls "$DIR"/*.sql 2>/dev/null | sort | tail -1)
    if [ -e "$FILE" ] && [ "$FILE" != "$NEWEST" ]; then
      deny "$(basename "$FILE") is an applied migration and immutable. Create a NEW sequential migration (NNN-description.sql) that alters the schema instead."
    fi
    ;;
esac

exit 0
