---
type: session
title: Daily Missions + XP/Levels + Achievements Full Implementation
date: 2026-06-01
project: my-loop
feature: feat-progression
status: complete
author: robin
tags: [xp, levels, missions, achievements, adaptive, code-review, qa, push-to-main]
files:
  - path: api/MyLoop.Api/Services/MissionService.cs
    role: created
  - path: api/MyLoop.Api/Services/AchievementService.cs
    role: created
  - path: api/MyLoop.Api/Constants/Achievements.cs
    role: created
  - path: api/MyLoop.Api/Constants/GameConstants.cs
    role: modified
  - path: api/MyLoop.Api/Controllers/MissionsController.cs
    role: created
  - path: api/MyLoop.Api/Controllers/AchievementsController.cs
    role: created
  - path: api/MyLoop.Api/Entities/DailyMission.cs
    role: created
  - path: api/MyLoop.Api/Entities/UserAchievement.cs
    role: created
  - path: api/MyLoop.Api/Entities/User.cs
    role: modified
  - path: api/MyLoop.Api/Models/TrailClaimResult.cs
    role: modified
  - path: api/MyLoop.Api/Data/AppDbContext.cs
    role: modified
  - path: api/MyLoop.Api/Program.cs
    role: modified
  - path: api/MyLoop.Api/Services/TerritoryService.cs
    role: modified
  - path: mobile/lib/shared/models/daily_mission.dart
    role: created
  - path: mobile/lib/shared/models/achievement.dart
    role: created
  - path: mobile/lib/shared/models/trail_claim_response.dart
    role: modified
  - path: mobile/lib/shared/services/api_service.dart
    role: modified
  - path: mobile/lib/features/home/home_tab.dart
    role: modified
  - path: mobile/lib/features/journey/journey_controller.dart
    role: modified
  - path: mobile/lib/features/journey/journey_screen.dart
    role: modified
  - path: mobile/lib/features/journey/celebration_dialog.dart
    role: modified
---

# Session: Daily Missions + XP/Levels + Achievements

## What Was Built

### 1. Daily Missions & XP System
- 3 adaptive daily missions per user with tier-based difficulty
- 6 mission types wired to actual gameplay events
- XP from multiple sources (captures, distance, steals, streaks, missions, achievements)
- Level system with quadratic formula: `(n-1)² × 100`
- Single-save-point architecture (no partial commits)

### 2. Achievements/Badges System
- 30 permanent achievements across 7 categories
- Convergence loop for cascading unlock (XP → level → level achievement)
- Concurrent-safe with DbUpdateException handling at save point
- TotalHexesStolen properly tracked (not approximated)
- AllMissionsCompleteDays denormalized counter (no expensive GROUP BY per claim)

### 3. Flutter UI
- DailyMissionsCard: 3 missions with progress bars, XP per mission, level display
- AchievementsCard: Unlocked badges, X/30 counter, next-up progress
- Live XP counter during walks
- Level-up snackbar (gold) and achievement unlock toast (purple)
- XP total in celebration dialog

## Decisions Made

- **Single save point**: All mutations (hex claim, missions, achievements, XP) saved in ONE SaveChangesAsync call. Prevents partial state.
- **Adaptive missions**: Player tier × behavior weights → weighted selection. Not random — tailored to how you play.
- **TotalHexesStolen column**: Explicit tracking instead of `TotalCaptured - HexCount` approximation (which was backwards — rewarded victims, not raiders).
- **Denormalized AllMissionsCompleteDays**: Avoids GROUP BY query on every hex capture. Incremented exactly once when 3rd mission of day completes.
- **Convergence loop**: Handles cascading level-up achievements. Max 5 iterations guaranteed.
- **Public achievements**: [Authorize] for auth, but no IDOR check — achievements are public (like profile badges).

## Bugs Found & Fixed

1. **PvP metric backwards** (Critical): `TotalCaptured - HexCount` rewarded victims, not raiders. Fixed with explicit `TotalHexesStolen` column.
2. **Cascading achievements missed** (Critical): Single-pass loop missed Level achievements triggered by XP from other unlocks. Fixed with convergence do/while.
3. **Unhandled DbUpdateException** (Critical): Concurrent achievement inserts caused 500 + lost hex claim. Fixed with catch → detach conflicting → retry save.
4. **Missing [Authorize]** (Important): AchievementsController was unauthenticated. Fixed.
5. **GROUP BY on every claim** (Important): Counting missions-complete-days via live query. Fixed with denormalized counter.
6. **Non-deterministic HashCode.Combine** (earlier fix): Mission seed used HashCode which varies per process. Fixed with XOR of userId bytes.

## Code Reviews Passed
- Staff engineer review: 3 critical + 5 important issues → all fixed
- QA engineer review: 1 critical (concurrency) confirmed → already fixed in staff review cycle

## Pushed to master
- Commit: `04d49bf` on `dev/walk-through-claim`
- Merge commit: `20802e7` on `master`
- Remote: `origin/master` updated

## Next Steps
- Identify next logical feature for 1M users
- Consider: Social features, clan system, events/challenges, territory decay visualization
