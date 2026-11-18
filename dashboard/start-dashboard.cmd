@echo off
cd /d "%~dp0"
set PY=python
where python >nul 2>&1 || set PY=py
echo [1/3] Building dashboard data...
%PY% build_data.py
echo [2/3] Starting server on http://localhost:3000 ...
start "" http://localhost:3000
echo [3/3] Dashboard running. Close this window to stop.
%PY% -m http.server 3000
