@echo off
cd /d "%~dp0"
call "%~dp0..\sync-vault.cmd"
set PY=python
where python >nul 2>&1 || set PY=py
start "" http://localhost:3000
echo Dashboard running (auto-refreshes). Close this window to stop.
%PY% server.py
