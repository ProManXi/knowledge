---
type: bug
title: "Daily Mission + Area Exploration cards empty when offline"
date: 2026-06-18
project: my-loop
feature: feat-progression
author: robin
status: in-progress
severity: medium
tags: [offline, home-cards, cache, hydration, missions, exploration, issue-34]
files:
  - path: mobile/lib/shared/state/hydration.dart
    role: root-cause
  - path: mobile/lib/shared/services/game_state_cache.dart
    role: created
  - path: mobile/lib/shared/services/api_service.dart
    role: analyzed
---

# Description
On the Home page, when the device is **offline**, the **Daily Mission** and **Area
Exploration** cards show no data, even though the user saw real values moments earlier
while online. (GitHub issue #34, fixed by PR #45.)

# Steps to Reproduce
1. Open the app online and let Home load (missions + exploration populate).
2. Go offline (airplane mode / no connectivity).
3. Cold-launch the app, or background → resume (triggers re-hydration).

# Expected Behavior
The cards show the last-known missions and exploration values from the last online load.

# Actual Behavior
Daily Mission shows "Missions loading…" / empty; Area Exploration shows the
"Start walking to explore…" empty state.

# Root Cause
Both cards are fed once on login/resume from the unified game-state endpoint via
`hydrateAllSlices` / `hydrateAllSlicesFromRef` (`hydration.dart`). That call,
`ApiService.getGameState`, **catches the offline Dio error and returns `null`** (and
logs a warning). Pre-fix, hydration treated `null` as "skip" and returned early, so
`missionsSliceProvider` and `explorationSliceProvider` stayed at their empty defaults.
The missions/exploration payloads had **no offline cache** (unlike `ProfileCache` #19
and the `StepClaimQueue` WAL), so there was no source for them offline.

# Fix
PR #45 adds a file-backed, user-bound `GameStateCache` mirroring `ProfileCache`: cache
the `missions` + `exploration` payloads (raw server JSON, exactly as the slices
consume) on every successful hydration; on the `null` (offline) branch, restore those
two slices from cache; bind to `userId` (cross-user guard); clear on sign-out / account
deletion. Profile stays with `ProfileCache`; achievements are intentionally not
restored offline (stale achievement state is undesirable). Approved
([[pr-2026-06-18-offline-home-cards-game-state-cache]]).

# Related
- [[feat-progression]]
- [[pr-2026-06-18-offline-home-cards-game-state-cache]]
- [[bug-2026-06-15-offline-restore-cross-user-identity]]
