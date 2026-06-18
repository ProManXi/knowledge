---
type: feature
title: Live Map — Info
project: my-loop
feature: feat-live-map
status: active
role: info
author: robin
tags: [map, maplibre, geojson, flutter-map, vector-tiles]
---

# Current Architecture

### Components
- **Base Map Layer**: `flutter_map` with dual tile sources:
  - **Satellite**: ESRI World Imagery (`server.arcgisonline.com/.../World_Imagery/...`) + ESRI Reference overlay for labels (`World_Boundaries_and_Places`)
  - **Dark**: CartoDB Dark All (`basemaps.cartocdn.com/dark_all/...`) — includes labels natively
  - Toggle button (top-right) lets user switch between views at runtime
- **Territory Overlay (MVP)**: GeoJSON served directly from .NET API. Endpoint: `GET /api/territories?bounds=lat1,lng1,lat2,lng2` returns hex polygons within bounding box.
- **Territory Overlay (Scale)**: Martin vector tile server added later when polygon count exceeds flutter_map's rendering capacity (~5,000+).
- **Animated Hex Overlay**: `AnimatedHexOverlay` widget with 3 zoom tiers:
  - < zoom 10: cluster beacon (pulsing dot)
  - zoom 10-14: bouncing dots per hex
  - zoom 14+: full polygon with wave motion, neon glow, pulsing fill
  - Three AnimationControllers: pulse (1.5s), wave (3s sweep), entrance (1s elastic bounce)
- **Flutter Map Widget**: `flutter_map` package renders hex polygons + polyline layer for active capture path.
- **GPS Drift Protection**: Journey controller filters GPS noise — readings must exceed noise floor (accuracy-based + speed-aware) to be recorded to path/distance. Prevents false distance accumulation when stationary.
- **Interaction**: Tap on territory hex → show owner avatar, name, claim date.

### Known Behaviors
- MVP: API serves GeoJSON polygons for visible area — flutter_map renders directly (handles ~2,000-5,000 polygons)
- Scale path: when cell count exceeds flutter_map capacity, add Martin vector tile server reading from PostGIS geometry column
- Territory geometry pre-computed in .NET during claim and stored in PostgreSQL (no h3-pg extension)
- At high zoom: individual hex cells visible. At low zoom: client-side simplification or server aggregation needed.
- Active capture path shown as animated polyline (client-side only, not synced to server until claim)
- Map centers on user's current location by default
- **Loading state**: Shows spinner + "Getting your location..." while acquiring GPS. If location fails, shows error with Retry button. Map does NOT render with center (0,0) anymore.
- **Dual hex loading on map open**:
  1. `_loadUserOwnHexes()` — calls `GET /api/territories/user/{userId}`, returns ALL user hexes unconditionally. Stored in `_userOwnHexBoundaries` (never overwritten by viewport refresh).
  2. `_loadAllHexes()` — calls `GET /api/territories?bounds=...` with ~5.5km radius around GPS. Returns all players' hexes in viewport. Stored in `_otherHexBoundaries`.
  - This dual approach ensures user always sees their territory even if captured at a different location.
- **Race condition protection**: `_updateHexState()` (viewport refresh, runs every 30s) only updates `_otherHexBoundaries`. It NEVER overwrites `_userOwnHexBoundaries`. `_userOwnCellIds` Set prevents duplicates when viewport and user endpoint return the same cells.
- **After claim**: User stays on map to see newly captured hexes. `forceReloadHexes()` calls both `_loadUserOwnHexes()` and viewport refresh. Newly captured hexes appear instantly via `showCapturedHexes()` (optimistic render).
- **Map never auto-flies to hex data**: Map always centers on GPS position. Prevents flying to wrong coordinates if hex data is corrupted.
- **Hex badge**: Shows `userProfileProvider.hexCount` (total from DB), not viewport-only count. Updates immediately after capture via optimistic increment + API refresh.

### Edge Cases
- Offline: show cached tiles, display "territory data may be outdated" banner
- Thousands of tiny territories at city scale → tile simplification at low zoom levels
- Color collision: two adjacent users with similar colors → server assigns colors with minimum contrast distance

## File Map
- `mobile/lib/features/journey/journey_screen.dart` — Map view with extracted widgets (`_CircleButton`, `_HexOwnerSheet`, `_StatsBar`, `_BottomControls`), claim flow in `_JourneyScreenState`
- `mobile/lib/features/journey/journey_controller.dart` — GPS state that feeds the map polyline, uses `LoopDetector`
- `mobile/lib/features/journey/hex_territory_manager.dart` — `HexTerritoryManager` class manages hex loading/state (extracted from journey_screen)
- `mobile/lib/features/journey/celebration_dialog.dart` — Post-claim celebration (extracted from journey_screen)
- `mobile/lib/shared/services/api_service.dart` — `getTerritories()`, `getUserTerritories()`, `submitClaim()`, `getGameState()`
- `mobile/lib/shared/services/territory_realtime_service.dart` — SignalR singleton: connect/disconnect, 5 event streams, JoinRegion/LeaveRegion/JoinUserGroup hub invocations
- `mobile/lib/shared/models/territory_cell.dart` — `TerritoryCell` model with `fromJson`
- `mobile/lib/shared/widgets/animated_hex_overlay.dart` — 3-tier zoom animation for hex rendering
- `mobile/lib/shared/state/profile_slice.dart` — ProfileState Notifier (hydrate + applyDelta)
- `mobile/lib/shared/state/xp_slice.dart` — XpState Notifier (hydrate + applyDelta)
- `mobile/lib/shared/state/missions_slice.dart` — MissionsState Notifier (hydrate + applyDelta)
- `mobile/lib/shared/state/achievements_slice.dart` — AchievementsState Notifier (hydrate + applyDelta)
- `mobile/lib/shared/state/exploration_slice.dart` — ExplorationState Notifier (hydrate only)
- `mobile/lib/shared/state/hydration.dart` — Orchestrator: GET /game-state → distribute to 5 slices
- `api/MyLoop.Api/Hubs/TerritoryHub.cs` — SignalR hub: JoinRegion, LeaveRegion, JoinUserGroup, LeaveUserGroup
- `api/MyLoop.Api/Services/TerritoryNotifier.cs` — 5 push methods: hex ownership, stats, xp, missions, achievements. **Resilient since abb321a (HIGH-10)**: `NotifyHexOwnershipChanged` wraps each region send in its own try/catch (one failed region no longer aborts the rest); personal deltas route through generic `SafeSendToUser<T>` that logs and never throws (no more unobserved fire-and-forget task exceptions).
- `api/MyLoop.Api/Interfaces/ITerritoryNotifier.cs` — Interface + all payload record definitions

## State Architecture (Map)

```
_JourneyMapState
├── _userOwnHexBoundaries: List<List<List<double>>>  — from /user/{id}, never overwritten
├── _otherHexBoundaries: List<List<List<double>>>    — from viewport query, refreshed every 30s
├── _capturedHexBoundaries: List<List<List<double>>> — from current session's claim (green flash)
├── _userOwnCellIds: Set<int>                        — dedup between user + viewport loads
├── _allCells: List<TerritoryCell>                   — full cell data for tap detection
├── _initialPosition: Position?                      — GPS fix
├── _followUser: bool                                — auto-center toggle
└── _mapReady: bool                                  — MapController initialized
```

## Integration Points
- `_loadUserOwnHexes()` → `GET /api/territories/user/{userId}` (all user hexes, no viewport)
- `_loadAllHexes()` / `_refreshViewportHexes()` → `GET /api/territories?bounds=...` (viewport-based)
- Active capture path comes from GPS tracking feature (local state in journey_controller)
- Territory tap queries `_allCells` list (client-side point-in-polygon hit test)
- Profile color applied to `_userOwnHexBoundaries` rendering
- Badge reads from `userProfileProvider.hexCount` (Riverpod, always DB total)

## Open Questions
- GeoJSON response size at 2,000+ cells — need to benchmark (may need pagination or simplification)
- When to introduce Martin (what cell count triggers the switch?)
- Should map show "contested" cells (recently stolen) with a special effect?
- Map style: dark/light mode theming for MapLibre base layer
- Wire `HexOwnershipChanged` SignalR event to live-update hex polygons on map (currently only loaded on init + viewport refresh)

## Real-Time State Architecture (IMPLEMENTED)

**Connection lifecycle:**
- SignalR connects ONCE after Firebase auth resolves in `login_screen.dart` (app-level, not per-screen)
- Requires Firebase ID token + userId for connection
- Joins `user_{myId}` group for personal events (validated in hub)
- Joins H3 res-3 region groups dynamically as map pans
- Reconnects automatically; on reconnect, calls full hydrate endpoint (`GET /game-state`)

**Events received (all verified matching C# ↔ Dart):**
| Event | Group | Method Name | Action in Client |
|-------|-------|-------------|-----------------|
| `HexOwnershipChanged` | Region (`parentCellId.ToString()`) | `HexOwnershipChanged` | Update hex overlay on map |
| `UserStatsDelta` | `user_{userId}` | `UserStatsDelta` | Update profile slice (hexCount, streak) |
| `XpDelta` | `user_{userId}` | `XpDelta` | Update XP slice |
| `MissionDelta` | `user_{userId}` | `MissionDelta` | Update missions slice |
| `AchievementUnlocked` | `user_{userId}` | `AchievementUnlocked` | Update achievements slice + celebration |

**Payload serialization:**
- C# records use PascalCase properties
- ASP.NET SignalR default JSON uses System.Text.Json with camelCase policy
- Dart `fromJson` keys use camelCase → matches exactly
- All Dart fromJson parsers use null-safe defaults (`as int? ?? 0`) for resilience

**State never refreshed via HTTP after claims** — all updates arrive as pushes.

**Broadcast resilience (abb321a, HIGH-10)**: server-side sends are now failure-isolated — a transport error to one region group or one user no longer cancels the remaining pushes, and personal-delta pushes can no longer throw unobserved. A dropped push is recovered by the next full hydrate on reconnect/resume.

**State Slices (Flutter — 5 independent Notifiers):**

| Slice | Provider | Data | Updated Via |
|-------|----------|------|-------------|
| Profile | `profileSliceProvider` | hexCount, totalHexesCaptured, totalHexesStolen, streak, isStreakActive, distanceKm, rank | `UserStatsDelta` push |
| XP | `xpSliceProvider` | totalXp, level, progressXp, neededXp, progressPercent | `XpDelta` push |
| Missions | `missionsSliceProvider` | missions[], allComplete | `MissionDelta` push |
| Achievements | `achievementsSliceProvider` | achievements[] | `AchievementUnlocked` push |
| Exploration | `explorationSliceProvider` | neighborhoods[] | Hydration only (no push) |

**Hydration endpoint**: `GET /api/users/{id}/game-state` returns all 5 slices in one call. Called on login and app resume via `hydrateAllSlices(ref)`. Never called during walks.

**No more post-walk refresh**: Walk capture just claims. All stat/XP/mission updates arrive via push before the walk celebration dialog even appears.

**Delta payload records (defined in `ITerritoryNotifier.cs`):**
- `UserStatsDelta(HexCount, TotalHexesCaptured, TotalHexesStolen, Streak, IsStreakActive, DistanceKm)` — absolute values, not deltas
- `XpDelta(XpGained, TotalXp, Level, LeveledUp, ProgressXp, NeededXp, ProgressPercent)`
- `MissionDelta(Updates: List<MissionUpdate>, AllMissionsComplete, BonusXp)`
- `MissionUpdate(MissionId, Type, CurrentProgress, TargetValue, Completed, XpAwarded)`
- `AchievementDelta(Unlocks: List<AchievementUnlockEvent>)`
- `AchievementUnlockEvent(Id, Name, Icon, XpAwarded)`

# Related
- [[feat-live-map]]
- [[dec-delta-push-architecture]]
