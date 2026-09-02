#!/usr/bin/env bash
# Calls the Gemini API with a single text prompt and prints the response text
# to stdout. Used by the "planner" subagent (.claude/agents/planner.md) to
# brainstorm interactive-feature ideas via Gemini instead of Claude itself.
#
# Usage:
#   ./scripts/ask-gemini.sh "your prompt here"
#   echo "your prompt" | ./scripts/ask-gemini.sh
#
# Requires GEMINI_API_KEY in the environment — this repo's .env.local (which
# is gitignored) sets it; source it before running this script directly:
#   set -a; source .env.local; set +a; ./scripts/ask-gemini.sh "..."
set -euo pipefail

# Pinned to a specific dated model rather than the "-latest" alias: the
# alias endpoint hung (60s+ timeout, no response) when this was set up,
# while the pinned model responded in ~1s. Override with GEMINI_MODEL= if
# this model gets retired later.
MODEL="${GEMINI_MODEL:-gemini-3.6-flash}"

if [ -z "${GEMINI_API_KEY:-}" ]; then
  echo "error: GEMINI_API_KEY is not set. Source .env.local first." >&2
  exit 1
fi

if [ "$#" -ge 1 ]; then
  PROMPT="$1"
else
  PROMPT="$(cat)"
fi

if [ -z "$PROMPT" ]; then
  echo "error: no prompt given (pass as an argument or pipe via stdin)." >&2
  exit 1
fi

REQUEST_BODY=$(jq -n --arg text "$PROMPT" '{contents: [{parts: [{text: $text}]}]}')

RESPONSE=$(curl -sS --max-time 60 \
  -X POST "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY")

ERROR_MESSAGE=$(echo "$RESPONSE" | jq -r '.error.message // empty')
if [ -n "$ERROR_MESSAGE" ]; then
  echo "Gemini API error: $ERROR_MESSAGE" >&2
  exit 1
fi

echo "$RESPONSE" | jq -r '.candidates[0].content.parts[].text' 2>/dev/null || {
  echo "error: couldn't parse a text response from Gemini. Raw response:" >&2
  echo "$RESPONSE" >&2
  exit 1
}
