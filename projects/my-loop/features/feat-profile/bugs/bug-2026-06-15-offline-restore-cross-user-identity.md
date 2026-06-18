---
type: bug
title: "Offline session restore could load the wrong user's profile"
project: my-loop
feature: feat-profile
status: resolved
severity: high
author: robin
date: 2026-06-15
tags: [auth, identity, offline, anti-cheat, cross-user, code-review]
files:
  - path: mobile/lib/features/auth/login_screen.dart
    role: root-cause
  - path: mobile/lib/shared/services/profile_cache.dart
    role: root-cause
---

# Description
Found during code review of PR #24 (offline login persistence). The offline-restore
path could drop one Firebase user into a *different* user's cached profile/session.

# Steps to Reproduce
1. User A logs in successfully → `ProfileCache` holds A's profile. A never signs out
   (so the cache is not cleared).
2. User B authenticates with Firebase on the same device, but the backend is
   unreachable during B's profile fetch.
3. The `catch` in `_routeAfterAuth` fires **before** `ProfileCache.save(B)` runs
   (save happens only after the server call succeeds).
4. `_restoreOfflineSession` sees `currentUser != null` (it is B) and a cached
   profile (still A) → restores A.

# Expected Behavior
A second account on the same device must never inherit the previous user's
profile/session, online or offline.

# Actual Behavior
B is dropped into A's profile offline. When B regains connectivity the app holds
`userId = A` under B's Firebase token → cross-user calls rejected by the IDOR guard
(from PR #15) at best, silent cross-user data exposure at worst. This is the
.NET ↔ Flutter identity/contract-drift class CLAUDE.md calls the #1 bug class.

# Root Cause
`ProfileCache` stored no Firebase UID, and `_restoreOfflineSession` only checked
`currentUser != null` — it never verified the cached profile belonged to the
*current* Firebase user. `_routeAfterAuth(firebaseUid)` already knew who just
authenticated but did not pass that identity into the restore check.

# Fix
Resolved in commit `1e578ff` (merged in PR #24):
- `ProfileCache` now stores `firebaseUid` alongside the profile via a new
  `CachedProfile` wrapper. `encode`/`decode` round-trip it; `decode` returns
  `null` when `firebaseUid` (or `userId`) is missing — so legacy caches written
  before this change are safely dropped on upgrade.
- `_restoreOfflineSession(error, firebaseUid)` bails unless
  `cached.firebaseUid == firebaseUid`.
- Secondary: `_restoreOfflineSession` now returns `false` when `!mounted` instead
  of falsely reporting it navigated.
Verified: the UID-mismatch path now falls through to the retry prompt instead of
restoring the wrong user.

## Evolution
- 2026-06-15 — Found in PR #24 review; fixed in `1e578ff` and verified. Resolved.

# Related
- [[feat-profile]]
- [[pr-2026-06-15-offline-login-cross-user-identity]]
