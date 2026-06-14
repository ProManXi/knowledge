---
type: decision
title: "Replace Monolithic GameState with Delta-Push Architecture"
date: 2026-06-01
project: my-loop
feature: feat-live-map
status: accepted
author: robin
tags: [architecture, signalr, state-management, real-time, delta-push]
---

# Decision: Delta-Push State Architecture

## Context

The app had fragmented state management — 4 independent `FutureProvider.autoDispose` that each made their own API calls, plus a monolithic `GameState` provider that was briefly introduced then rejected. Both approaches are wrong:
- Individual providers: redundant API calls, stale data, no sharing
- Monolithic GameState: over-fetches everything on any change (like reloading entire DOM for one div update)

## Decision

Adopt **event-driven delta-push** architecture:
- **One full hydration** on login (single API call fills all state slices)
- **Per-action deltas** pushed via SignalR to affected user (no HTTP polling after actions)
- **5 independent state slices** in Flutter, each subscribable individually
- **SignalR connected at app level** (not per-screen), with per-user group for private events

## Consequences

### Backend Changes
- `TerritoryHub`: Add `JoinUserGroup(userId)` / `LeaveUserGroup(userId)` (authenticated)
- `ITerritoryNotifier`: Add 4 new methods for personal event push (UserStats, XP, Missions, Achievements)
- Claim services fire personal notifications AFTER `SaveChangesAsync` succeeds
- Victim also receives `UserStatsDelta` when their hex is stolen

### Frontend Changes
- SignalR promotes from per-screen to app-lifecycle singleton
- 5 slice notifiers replace both legacy providers AND monolithic GameState
- Each slice: `hydrate()` on login, `applyDelta(event)` on push
- No more `_refreshUserData()` with 7 API calls post-walk
- Walk capture just claims — pushes deliver all updates

### New SignalR Events (Server → Client, per-user group)

| Event | Payload | When |
|-------|---------|------|
| `UserStatsDelta` | `{hexCount, totalCaptured, totalStolen, streak, isStreakActive, distanceKm}` | After any claim or theft |
| `XpDelta` | `{xpGained, totalXp, level, leveledUp, progressXp, neededXp, progressPercent}` | After XP award |
| `MissionDelta` | `{updates: [{missionId, progress, completed, xpAwarded}], allMissionsBonus}` | After mission tick |
| `AchievementUnlocked` | `{unlocks: [{id, name, icon, xpAwarded}]}` | After achievement check |

### Existing (Unchanged)
| Event | Scope | Still works |
|-------|-------|-------------|
| `HexOwnershipChanged` | Region (H3 res-3) group | Yes — public map updates |

## Rejected Alternatives

1. **WebSocket for claims (replace HTTP POST)**: Loses delivery guarantees, requires custom ACK protocol, worse during network transitions
2. **Single big state with full refresh**: Over-fetches, slow, no granularity
3. **Individual REST polling per provider**: Status quo — wasteful, stale, fragmented

## Hydration Strategy

| Trigger | Action |
|---------|--------|
| Login | `GET /api/users/{id}/game-state` → fills all 5 slices |
| App resume (background → foreground) | Same full hydrate (missed pushes while suspended) |
| Step claim during walk | Nothing — server pushes arrive automatically |
| Walk loop capture | Nothing — server pushes arrive automatically |
| Being robbed | Server pushes `UserStatsDelta` to victim |
| Pull-to-refresh | Single slice refresh only |

## Implementation Phases

1. Backend: Hub + Notifier methods + fire events after claims
2. Frontend: Slice providers + SignalR listeners (parallel to legacy)
3. Migrate screens one-at-a-time to slices
4. Delete legacy providers + monolithic GameState
5. Multi-device E2E testing
