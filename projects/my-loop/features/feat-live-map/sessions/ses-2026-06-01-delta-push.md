---
type: session
title: "Delta-Push Architecture Design & Implementation"
date: 2026-06-01
project: my-loop
feature: feat-live-map
status: complete
author: robin
continues-in: "[[ses-2026-06-02-delta-push-implementation]]"
tags: [architecture, signalr, state-management, refactor]
files:
  - path: api/MyLoop.Api/Hubs/TerritoryHub.cs
    role: to-modify
  - path: api/MyLoop.Api/Services/TerritoryNotifier.cs
    role: to-modify
  - path: api/MyLoop.Api/Interfaces/ITerritoryNotifier.cs
    role: to-modify
  - path: api/MyLoop.Api/Services/TerritoryService.cs
    role: to-modify
  - path: api/MyLoop.Api/Controllers/UsersController.cs
    role: modified
  - path: mobile/lib/shared/services/game_state.dart
    role: to-delete
  - path: mobile/lib/shared/services/territory_realtime_service.dart
    role: to-modify
  - path: mobile/lib/shared/services/api_service.dart
    role: modified
  - path: mobile/lib/features/home/home_tab.dart
    role: modified
  - path: mobile/lib/features/journey/journey_screen.dart
    role: modified
---

# Session: Delta-Push Architecture

## What Happened

1. User proposed using WebSocket for step claims during walks
2. I pushed back — HTTP POST is more reliable for claims (delivery guarantee, retry-friendly)
3. Agreed on hybrid: HTTP for claims, SignalR for pushing state deltas back
4. Analyzed the monolithic `GameState` approach (just built) — rejected it as over-fetching
5. User described "3 tree heads" model (login hydrate, per-step delta, loop-complete broader delta)
6. Designed proper delta-push architecture with 5 slices + per-user SignalR group
7. Full system audit completed (all endpoints, models, state surfaces, mutation paths)
8. Plan approved by user — implement phase by phase with verification

## Architecture Decision

See: `decisions/dec-delta-push-architecture.md`

## Changes Already Made (Before Delta Decision — Will Be Reverted/Replaced)

- Added `GET /api/users/{id}/game-state` endpoint (UsersController) — **KEEP for hydration**
- Created `game_state.dart` with monolithic `GameState` + `GameStateNotifier` — **DELETE, replace with slices**
- Modified `home_tab.dart` providers to read from `gameStateProvider` — **REVERT, rewire to slices**
- Modified `journey_screen.dart` `_refreshUserData` to use `gameStateProvider.refresh()` — **DELETE this method entirely**
- Added `getGameState()` to `api_service.dart` — **KEEP for login hydration**

## Implementation Plan

### Phase 1: Backend — Hub + Notifications
- Add `JoinUserGroup(userId)` to TerritoryHub (authenticated)
- Add `NotifyUserStatsAsync`, `NotifyXpAsync`, `NotifyMissionAsync`, `NotifyAchievementAsync` to ITerritoryNotifier
- Fire all 4 personal events in `ProcessStepClaim` AFTER SaveChanges
- Fire `UserStatsDelta` to victim on theft
- Same for `ProcessClaim` and `ProcessTrailClaim`
- Verify: API builds, SignalR debugger shows events firing

### Phase 2: Frontend — SignalR Singleton + Slice Providers
- Promote `TerritoryRealtimeService` to app-lifecycle (connect on login, not per-screen)
- Add streams: `userStatsStream`, `xpStream`, `missionStream`, `achievementStream`
- Create 5 slice notifiers in `lib/shared/state/`:
  - `profile_slice.dart` — hexCount, streak, distance, rank
  - `xp_slice.dart` — totalXp, level, progress
  - `missions_slice.dart` — daily mission list + progress
  - `achievements_slice.dart` — unlocked list
  - `exploration_slice.dart` — neighborhoods (no real-time, load on demand)
- Each subscribes to its SignalR stream + has `hydrate(data)` for initial load
- Verify: Slices react to manual SignalR events, print deltas

### Phase 3: Migrate Screens
- HomeTab → read from slice providers
- ProfileScreen → read from profile slice
- JourneyScreen → delete `_refreshUserData`, trust pushes
- LeaderboardScreen → keep API fetch (leaderboard is scope-based, not pushed)
- Verify: Walk on device, home tab updates without manual refresh

### Phase 4: Cleanup
- Delete `game_state.dart` (monolithic)
- Delete old `dailyMissionsProvider`, `xpInfoProvider`, `achievementsProvider`, `explorationProvider` from home_tab
- Remove all `ref.invalidate(...)` calls for deleted providers
- Verify: No dead code, app compiles, all screens work

### Phase 5: Multi-Device E2E
- Two phones, two accounts
- Walk through each other's territory
- Verify: Both devices update in real-time (map + stats + notifications)

## Open Questions
- SignalR auth: Add [Authorize] to hub or validate user group membership manually?
- App resume: How to detect missed events? (Timestamp comparison vs full re-hydrate?)
- Leaderboard: Push-based or keep polling? (Decision: keep polling for now)

## Next Steps
- Start Phase 1: Backend hub + notifier changes
