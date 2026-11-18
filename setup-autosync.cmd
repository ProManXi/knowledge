@echo off
REM Run ONCE. Syncs the vault with GitHub every 15 minutes and at login.
schtasks /create /tn "VaultSync" /tr "\"%~dp0sync-vault.cmd\"" /sc minute /mo 15 /f
schtasks /create /tn "VaultSyncLogin" /tr "\"%~dp0sync-vault.cmd\"" /sc onlogon /f
echo.
echo Done. Vault will sync automatically.
pause
