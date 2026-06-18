---
type: feature
title: Leaderboard — Info
project: my-loop
feature: feat-leaderboard
status: active
role: info
author: robin
tags: [leaderboard, rankings, daily, batch-job]
---

# Current Architecture

### Components
- **Daily Batch Job**: CRON job at 00:00 local time computes leaderboard from `territories` table.
- **Leaderboard Snapshots Table**: Stores daily rankings. Query: `SELECT owner_id, COUNT(*) as cells, COUNT(*) * 2150.0 as area_m2 FROM territories GROUP BY owner_id ORDER BY cells DESC`
- **API Endpoint**: `GET /api/leaderboard?city={city_id}&date={date}` — returns top N + user's rank.
- **Display**: Top 3 shown prominently with avatars. User's own rank always visible. Nearby ranks (±2) shown.

### Known Behaviors
- Refreshes once daily at 00:00 local time (not real-time)
- Scoped by city for MVP
- Area = cell count × 2,150 m² (H3 resolution 11 average cell area)
- Ties broken by: earliest claim timestamp (first to reach that cell count wins)
- No Redis needed for MVP — simple DB query on snapshot table

### Edge Cases
- Multi-timezone: when going global, schedule per-city batch jobs using city timezone
- User joins mid-day: appears on next day's leaderboard
- User loses all territory: still appears with 0 (or minimum rank display threshold?)
- City boundaries: use H3 resolution 3-4 parent cells to define city zones

## File Map
- `mobile/lib/features/leaderboard/leaderboard_screen.dart` — Top 3 podium + ranking list, tappable rows open user profile, Expanded podium items (responsive), `go_router` import for navigation. Each player row has a small colored hexagon icon (`Icons.hexagon, size: 14`) before the name — color matches their `HexTier.fromHexes(hexCount).color`. Tier visible at a glance without text.
- `api/MyLoop.Api/Services/LeaderboardService.cs` — GetLeaderboard, RefreshLeaderboard, BuildScopedQuery, FetchTopEntries, ResolveUserRank, UpdateAchievementCounters, PurgeOldEntries (all methods ≤40 lines, implements ILeaderboardService)
- `api/MyLoop.Api/Services/ILeaderboardService.cs` — Interface
- `api/MyLoop.Api/Controllers/LeaderboardController.cs` — GET /api/leaderboard endpoint (thin controller)

## Integration Points
- Reads from `territories` table (owned cells per user)
- Batch job writes to `leaderboard_snapshots` table
- API serves from snapshot table (fast reads, no live aggregation)
- Push notification when user enters top 3
- Tapping any player (podium or list) pushes `/user-profile` route with player data as `extra`
- "You" row highlighted with primary color tint, not tappable (own profile accessible via gear icon on home)

## Open Questions
- Exact city zone definition (H3 parent resolution? Manual city boundary polygons?)
- Should leaderboard show "change since yesterday" (↑↓ indicators)?
- Minimum cell count to appear on leaderboard (filter out 1-cell owners?)
- Future: weekly/monthly/all-time leaderboard views

# Related
- [[feat-leaderboard]]
