---
type: feature
title: Progression System — Info
project: my-loop
feature: feat-progression
status: active
role: info
author: robin
tags: [xp, levels, missions, achievements, badges, retention, adaptive]
---

# Current Architecture

### Components

**API Services:**
- **MissionService** (`api/MyLoop.Api/Services/MissionService.cs`): Generates 3 adaptive daily missions, records progress, awards XP. Single save point via `AwardXp`. Race-condition safe (DbUpdateException catch → ChangeTracker.Clear() → re-fetch).
- **AchievementService** (`api/MyLoop.Api/Services/AchievementService.cs`): Checks all 30 achievements against user stats, unlocks qualifying ones with convergence loop for cascading level-ups. Does NOT save — caller saves.
- **Achievement Definitions** (`api/MyLoop.Api/Constants/Achievements.cs`): Static catalog of 30 achievements in 7 categories.

**Key Patterns:**
- **Single-save-point**: `RecordProgress` and `CheckAndUnlock` mutate tracked entities but don't call `SaveChangesAsync`. `AwardXp` is the sole save point for the entire step-claim operation.
- **Concurrent unlock safety**: `AwardXp` wraps `SaveChangesAsync` in try/catch for `DbUpdateException` — detaches conflicting achievement inserts and retries.
- **Convergence loop**: `CheckAndUnlock` loops until no new achievements unlock (handles XP from one achievement triggering a Level achievement).
- **Adaptive mission generation**: Player tier (Newcomer/Regular/Veteran/Elite) × behavior weights → weighted selection with type diversity enforcement.

### XP System

| Source | Amount |
|--------|--------|
| Hex capture | 10 XP |
| Hex stolen | 25 XP |
| Per km walked | 50 XP |
| Streak bonus | 20 XP |
| All missions complete | 100 XP bonus |
| Mission completion | Per-mission XP (varies by tier) |
| Achievement unlock | Per-achievement (25–1000 XP) |

**Level Formula**: `XpForLevel(n) = (n-1)² × 100`
- Level 1 = 0 XP, Level 2 = 100, Level 5 = 1,600, Level 10 = 8,100, Level 50 = 240,100
- `LevelFromXp(xp) = 1 + (int)√(xp / 100)`

### Daily Missions

**Generation Algorithm:**
1. `ClassifyPlayerTier`: Newcomer (<3 days, <10 hexes), Regular, Veteran, Elite (>30 days, >500 hexes)
2. `ComputeBehaviorWeights`: Based on DistanceKm, TotalHexesCaptured, TopThreeFinishes, Streak, HexCount
3. `WeightedSelect` with type diversity enforcement (no duplicates)
4. Deterministic seed: `XOR(userId.bytes[0..3], userId.bytes[4..7]) ^ date.DayNumber`

**Mission Types:**
- `CaptureHexes` (N hexes)
- `WalkDistance` (~30m per hex, approximate)
- `StealHex` (capture from another player)
- `ExploreNewArea` (claim cells never visited before)
- `MaintainStreak` (keep streak alive today)
- `CaptureInOneWalk` (N hexes in single session)

### Achievements (30 total)

**Categories:**
| Category | Count | Stat Tracked | Examples |
|----------|-------|-------------|----------|
| Capture | 7 | TotalHexesCaptured | first_capture (1), capture_1000 (1000) |
| Streak | 6 | MaxStreak | streak_3, streak_100 |
| Distance | 5 | DistanceKm (int cast) | distance_1km, distance_500km |
| PvP | 4 | TotalHexesStolen | first_blood (1), raider_100 (100) |
| Level | 4 | Level | level_5, level_50 |
| Leaderboard | 2 | TopThreeFinishes | podium_1, podium_10 |
| Missions | 3 | AllMissionsCompleteDays | missions_7, missions_100 |

**XP Rewards**: Range from 25 (first_capture) to 1000 (streak_100, distance_500km).

### Integration Points

- **ProcessStepClaim** (TerritoryService): After hex capture + stat update → `RecordProgress` (missions) → `CheckAndUnlock` (achievements) → `AwardXp` (single save)
- **RecordExploration** returns `bool` (true if genuinely new cell) → feeds `ExploreNewArea` mission
- **AllMissionsCompleteDays**: Denormalized counter on User, incremented when 3rd mission of day completes
- **TotalHexesStolen**: Incremented in ProcessStepClaim when `existing != null` (cell was owned by someone else)

### Known Behaviors

- Missions regenerate at midnight (per user's date context)
- Same missions for same user on same day (deterministic seed)
- Achievement check runs on every hex capture (negligible perf: HashSet lookup + int comparison × 30)
- Worst case convergence: 5 iterations (initial + 4 level achievements + 1 empty verification)
- Progress % capped at 1.0 via `Math.Min(1.0, current/threshold)`
- Distance achievements use integer truncation (`(int)DistanceKm`)

### Edge Cases

- Concurrent claims: Second `SaveChangesAsync` may hit unique constraint on UserAchievements → caught, conflicting achievement inserts detached, retry save (hex claim preserved)
- Race condition on mission generation: Two requests generate same day's missions simultaneously → DbUpdateException caught, ChangeTracker cleared, re-fetch existing missions
- All 30 achievements already unlocked: Loop body skips everything (HashSet check), exits immediately
- User with 0 stats: All thresholds ≥1, no unlocks triggered, all progress = 0.0

## File Map

### Backend
- `api/MyLoop.Api/Services/MissionService.cs` — Mission generation, progress recording, XP awarding (with concurrency retry)
- `api/MyLoop.Api/Services/AchievementService.cs` — Achievement checking with convergence loop
- `api/MyLoop.Api/Constants/Achievements.cs` — 30 static achievement definitions
- `api/MyLoop.Api/Constants/GameConstants.cs` — XP values, level formula, missions per day
- `api/MyLoop.Api/Controllers/MissionsController.cs` — GET /api/missions/{userId}, GET /api/missions/xp/{userId}
- `api/MyLoop.Api/Controllers/AchievementsController.cs` — GET /api/achievements/{userId} [Authorize]
- `api/MyLoop.Api/Entities/DailyMission.cs` — Mission entity (Id, UserId, Date, Type, Target, Progress, XpReward, CompletedAt)
- `api/MyLoop.Api/Entities/UserAchievement.cs` — Achievement unlock record (Id, UserId, AchievementId, UnlockedAt, XpAwarded)
- `api/MyLoop.Api/Entities/User.cs` — Added: TotalXp, Level, TotalHexesStolen, AllMissionsCompleteDays
- `api/MyLoop.Api/Models/TrailClaimResult.cs` — StepClaimResponse includes XpGained, LeveledUp, NewLevel, AchievementsUnlocked

### Frontend
- `mobile/lib/shared/models/daily_mission.dart` — DailyMission + XpInfo models. `copyWith({int? currentProgress, bool? isCompleted, DateTime? completedAt})` + `bool get completed` convenience getter.
- `mobile/lib/shared/models/achievement.dart` — Achievement model with category name getter. `copyWith({bool? unlocked, DateTime? unlockedAt, double? progress})`.
- `mobile/lib/shared/models/trail_claim_response.dart` — StepClaimResponse + AchievementUnlocked
- `mobile/lib/shared/services/api_service.dart` — getDailyMissions, getXpInfo, getAchievements, getGameState
- `mobile/lib/shared/services/territory_realtime_service.dart` — SignalR event streams: MissionDelta, XpDelta, AchievementUnlocked
- `mobile/lib/shared/state/xp_slice.dart` — XpState Notifier, hydrate() + applyDelta(XpDelta)
- `mobile/lib/shared/state/missions_slice.dart` — MissionsState Notifier, hydrate() + applyDelta(MissionDelta)
- `mobile/lib/shared/state/achievements_slice.dart` — AchievementsState Notifier, hydrate() + applyDelta(AchievementDelta)
- `mobile/lib/features/home/home_tab.dart` — _DailyMissionsCard + _AchievementsCard widgets (now read from slice providers, not FutureProviders)
- `mobile/lib/features/journey/journey_controller.dart` — xpGainedThisWalk, levelUpTo, achievementUnlocked state
- `mobile/lib/features/journey/journey_screen.dart` — XP counter in stats bar, level-up/achievement snackbars
- `mobile/lib/features/journey/celebration_dialog.dart` — XP earned display in celebration

### Schema
- `DailyMissions` table: unique index on (UserId, Date) for mission generation idempotency
- `UserAchievements` table: unique index on (UserId, AchievementId) for concurrent unlock safety
- `Users` table: TotalXp (bigint), Level (int), TotalHexesStolen (int), AllMissionsCompleteDays (int)

## Open Questions

- Should achievements be visible to other players? (Currently: yes, endpoint is [Authorize] but no IDOR check — by design, like profile badges)
- Achievement-triggered level-up not surfaced as separate level-up banner to client (only achievement toast shown) — minor UX gap
- Distance achievements use int truncation: 0.99km → 0% progress on "Walk 1km" — acceptable?

## Real-Time Push Integration (Delta Architecture)

**Mission progress pushed via `MissionDelta` event (SignalR, per-user group):**
- Fired after `RecordProgress` in `ProcessStepClaim`
- Payload: `{ updates: [{missionId, type, progress, target, completed, xpAwarded}], allMissionsBonus }`
- Flutter `missions_slice` applies delta without API call
- UI updates per-step during walk (not just after walk ends)

**Achievement unlocks pushed via `AchievementUnlocked` event:**
- Fired after `CheckAndUnlock` completes with new unlocks
- Payload: `{ unlocks: [{id, name, icon, category, xpAwarded}] }`
- Flutter `achievements_slice` appends unlock + triggers celebration UI
- No more "silent" achievement discovery only on home tab refresh

**XP pushed via `XpDelta` event:**
- Fired after `AwardXp` succeeds
- Payload: `{ xpGained, totalXp, level, leveledUp, progressXp, neededXp, progressPercent }`
- Flutter `xp_slice` applies — home page XP bar updates in real-time

**All fired AFTER `SaveChangesAsync` succeeds** — never on uncommitted state.
- Future: time-limited/seasonal achievements? Would require adding expiry fields to definitions.
