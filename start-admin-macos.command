#!/usr/bin/env sh
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found. Please install Node.js 18 or newer."
  printf "Press Enter to close..."
  read _answer
  exit 1
fi

node scripts/run-admin.js
