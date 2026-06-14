---
type: bug
title: TTL Reaper Deletes Staging Environments
date: 2026-05-25
project: dev-forge
feature: feat-environments
status: resolved
severity: high
author: robin
tags: [ttl, reaper, staging, data-loss]
files:
  - path: controllers/reaper/ttl_reaper.go
    role: root-cause
  - path: controllers/reaper/ttl_reaper.go
    role: modified
---

# Description
Two staging environments were unexpectedly destroyed by the TTL reaper. These should have been persistent (infinite TTL).

# Root Cause
The TTL reaper checked `spec.ttl` field — but staging environments created before the CRD schema update had `ttl: ""` (empty string) instead of `ttl: 0` (infinite). Empty string was parsed as 0 duration, which is "already expired".

# Fix
- Treat empty/null TTL as infinite (no expiry) rather than "expired immediately"
- Added `spec.persistent: true` field for staging envs as an explicit override
- Backfilled all existing staging environments with `persistent: true`

# Impact
2 staging environments destroyed. Databases recoverable from automated backups (RPO: 1h). Team lost ~30min recreating environment configs.
