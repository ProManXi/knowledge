@echo off
REM Two-way vault sync: pull remote changes, commit local ones, push.
cd /d "%~dp0"
git pull --rebase --autostash -q
git add -A
git diff --cached --quiet || git commit -q -m "vault auto-sync"
git push -q
