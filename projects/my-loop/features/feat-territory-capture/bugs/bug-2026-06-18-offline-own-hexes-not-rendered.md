---
type: bug
title: "Own hexes vanish from Start Journey map when offline"
date: 2026-06-18
project: my-loop
feature: feat-territory-capture
author: robin
status: in-progress
severity: medium
tags: [offline, hex-rendering, cache, journey-map, issue-33]
files:
  - path: mobile/lib/features/journey/hex_territory_manager.dart
    role: root-cause
  - path: mobile/lib/shared/services/territory_cache.dart
    role: created
  - path: mobile/lib/shared/models/territory_cell.dart
    role: modified
---

# Description
On the Start Journey map, when the device is **offline**, the user's own pre-occupied
hexes are not rendered — the map shows none of their territory. Online they appear
normally. (GitHub issue #33, fixed by PR #44.)

# Steps to Reproduce
1. Sign in and claim some hexes (so the account owns territory).
2. Go offline (airplane mode / no connectivity).
3. Open the Start Journey page.

# Expected Behavior
The user's last-known owned hexes render on the map.

# Actual Behavior
None of the user's own hexes are drawn — their territory disappears.

# Root Cause
`HexTerritoryManager.loadUserOwnHexes()` fetched owned hexes via
`ApiService.getUserTerritories()` and, on failure, ran an **empty `catch (_) {}`**.
Offline, the Dio call throws a connection error; the empty catch swallowed it and
left `userOwnHexBoundaries` / `userOwnCellIds` empty. The Start Journey screen has no
other source for owned hexes (`_acquireLocation()`, `forceReloadHexes()`), so they
vanished. Unlike the profile (cached by `ProfileCache`, issue #19) and the mid-journey
GPS path (persisted `StepClaimQueue` WAL), owned territory had **no offline cache**.

# Fix
PR #44 adds a file-backed, user-bound `TerritoryCache` mirroring the `ProfileCache`
pattern: save the owned set on a successful fetch, restore from cache on failure (only
when no owned cells were already loaded this session), bind the cache to its `userId`
(cross-user guard), and clear it on sign-out / account deletion. `TerritoryCell.toJson`
is added to round-trip the cells.

Review note (PR #44, [[pr-2026-06-18-offline-own-hexes-territory-cache]]): the offline
fallback fires on **any** thrown error, not just connectivity — requested narrowing it
to the existing `isServerUnreachable(e)` primitive (used in #19/#43) so a 5xx/parse bug
isn't silently masked behind stale cache. Change requested; awaiting the push.

# Related
- [[feat-territory-capture]]
- [[pr-2026-06-18-offline-own-hexes-territory-cache]]
- [[bug-2026-06-15-offline-restore-cross-user-identity]]
