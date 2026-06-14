@echo off
REM ─────────────────────────────────────────────────────────
REM  Knowledge Vault Dashboard — Launch Script
REM  1. Regenerates data from vault
REM  2. Starts local server
REM  3. Opens Chrome
REM ─────────────────────────────────────────────────────────

echo [1/3] Generating data from vault...
node build-data.js

echo [2/3] Starting local server on port 3000...
start /B npx --yes http-server . -p 3000 -c-1 --cors -s >nul 2>&1

echo [3/3] Opening Chrome...
timeout /t 2 /nobreak >nul
start chrome http://localhost:3000

echo.
echo Dashboard running at http://localhost:3000
echo Press Ctrl+C to stop the server.
pause
