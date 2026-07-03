#!/usr/bin/env bash
#
# start-local.sh — macOS/Linux equivalent of scripts/start-local.ps1.
#
# Stops any process listening on the configured HTTP port (PORT env or 8080),
# installs npm packages, downloads Go modules, then runs `npm run dev`.
#
# Usage: ./scripts/start-local.sh [port]

set -u

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root" || exit 1

listen_port=8080
if [[ "${PORT:-}" =~ ^[0-9]+$ ]]; then
  listen_port=$PORT
elif [[ "${1:-}" =~ ^[0-9]+$ ]]; then
  listen_port=$1
fi

echo "Stopping listeners on port $listen_port..."
pids=$(lsof -ti tcp:"$listen_port" -sTCP:LISTEN 2>/dev/null || true)
for pid in $pids; do
  [[ "$pid" == "$$" ]] && continue
  name=$(ps -p "$pid" -o comm= 2>/dev/null || echo '?')
  echo "  Stopping PID $pid ($name)"
  kill "$pid" 2>/dev/null
done
# Give sockets a beat to release before rebinding.
[[ -n "$pids" ]] && sleep 1

if ! command -v npm >/dev/null 2>&1; then
  echo "error: npm not found. Install Node.js and ensure it is on PATH." >&2
  exit 1
fi
if ! command -v go >/dev/null 2>&1; then
  echo "error: go not found. Install Go and ensure it is on PATH." >&2
  exit 1
fi

echo "Installing npm dependencies..."
npm install || exit $?

echo "Downloading Go modules..."
go mod download || exit $?

echo "Starting dev server (npm run dev)..."
npm run dev
