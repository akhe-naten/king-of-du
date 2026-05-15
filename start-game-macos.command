#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found. Please install Node.js 18 or newer."
  printf "Press Enter to close..."
  read -r _answer
  exit 1
fi

node scripts/run-game.js
