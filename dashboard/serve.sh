#!/bin/bash
# ─────────────────────────────────────────────────────────
#  Knowledge Vault Dashboard — Launch Script (macOS/Linux)
#  1. Regenerates data from vault
#  2. Starts local server
#  3. Opens browser
# ─────────────────────────────────────────────────────────

echo "[1/3] Generating data from vault..."
node build-data.js

echo "[2/3] Starting local server on port 3000..."
npx --yes http-server . -p 3000 -c-1 --cors -s &
SERVER_PID=$!

sleep 2
echo "[3/3] Opening browser..."
if command -v xdg-open &> /dev/null; then
  xdg-open http://localhost:3000
elif command -v open &> /dev/null; then
  open http://localhost:3000
fi

echo ""
echo "Dashboard running at http://localhost:3000"
echo "Press Ctrl+C to stop."
wait $SERVER_PID
