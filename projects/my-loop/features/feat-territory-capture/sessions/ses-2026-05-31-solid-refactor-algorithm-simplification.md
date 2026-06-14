---
type: session
title: SOLID Refactor + 51% Rule Removal + H3 Resolution 11
date: 2026-05-31
project: my-loop
feature: feat-territory-capture
status: complete
author: robin
continues-from: "[[ses-2026-05-30-h3-radian-fix-claim-refactor]]"
tags: [solid-refactor, algorithm-simplification, code-quality, h3-resolution, frontend-refactor, merge-to-main]
files:
  - path: api/MyLoop.Api/Services/HexGridService.cs
    role: rewritten
  - path: api/MyLoop.Api/Services/TerritoryService.cs
    role: rewritten
  - path: api/MyLoop.Api/Services/UserService.cs
    role: rewritten
  - path: api/MyLoop.Api/Services/LeaderboardService.cs
    role: rewritten
  - path: api/MyLoop.Api/Services/ITerritoryService.cs
    role: modified
  - path: api/MyLoop.Api/Services/IUserService.cs
    role: created
  - path: api/MyLoop.Api/Services/ILeaderboardService.cs
    role: created
  - path: api/MyLoop.Api/Services/IHexGridService.cs
    role: created
  - path: api/MyLoop.Api/Services/IGeoService.cs
    role: created
  - path: api/MyLoop.Api/Services/GeoService.cs
    role: created
  - path: api/MyLoop.Api/Services/IValidationService.cs
    role: created
  - path: api/MyLoop.Api/Services/ValidationService.cs
    role: created
  - path: api/MyLoop.Api/Controllers/ClaimsController.cs
    role: created
  - path: api/MyLoop.Api/Controllers/TerritoryController.cs
    role: rewritten
  - path: api/MyLoop.Api/Controllers/UsersController.cs
    role: rewritten
  - path: api/MyLoop.Api/Controllers/LeaderboardController.cs
    role: rewritten
  - path: api/MyLoop.Api/Constants/GameConstants.cs
    role: modified
  - path: api/MyLoop.Api/Models/RegisterRequest.cs
    role: created
  - path: api/MyLoop.Api/Models/UpdateUserRequest.cs
    role: created
  - path: api/MyLoop.Api/Models/ClaimRequest.cs
    role: created
  - path: api/MyLoop.Api/Models/PreviewRequest.cs
    role: created
  - path: api/MyLoop.Api/Models/ClaimResponse.cs
    role: created
  - path: api/MyLoop.Api/Models/TerritoryResponses.cs
    role: created
  - path: api/MyLoop.Api/Models/UserProfileResponse.cs
    role: created
  - path: api/MyLoop.Api/Models/LeaderboardResponse.cs
    role: created
  - path: api/MyLoop.Api/Models/HexCell.cs
    role: created
  - path: api/MyLoop.Api/Models/GeoCoordinate.cs
    role: created
  - path: mobile/lib/features/journey/loop_detector.dart
    role: created
  - path: mobile/lib/features/journey/hex_territory_manager.dart
    role: created
  - path: mobile/lib/features/journey/celebration_dialog.dart
    role: created
  - path: mobile/lib/features/journey/journey_controller.dart
    role: rewritten
  - path: mobile/lib/features/journey/journey_screen.dart
    role: rewritten
---

## What Was Built

### 1. Algorithm Simplification — Removed 51% Boundary Rule

The hex capture algorithm was over-engineered. The "51% boundary intersection ratio" check was removed entirely. The new algorithm uses exactly 2 rules:

1. **Trail cells**: Any H3 cell whose center the path crosses through → claimed
2. **Interior fill**: If path forms a closed loop, any H3 cell whose center is inside the loop polygon → claimed

No boundary overlap math. No percentage thresholds. Simple point-in-polygon test.

### 2. Full Backend SOLID Refactor

Every backend service rewritten to follow SOLID principles:

**Architecture changes:**
- All services now have proper interfaces (`IHexGridService`, `ITerritoryService`, `IUserService`, `ILeaderboardService`, `IGeoService`, `IValidationService`)
- All dependencies injected via constructor (no `new` keywords)
- No method exceeds 40 lines
- `ClaimResult` uses static factory pattern: `ClaimResult.Failure(error)`, `ClaimResult.Succeeded(data)`
- Separate `GeoService` for geographic calculations (Haversine distance, polygon area)
- Separate `ValidationService` for input validation
- `ClaimsController` extracted from `TerritoryController` (was getting fat)
- All model files split: one class per file

**HexGridService decomposition:**
- `ComputeCapturedCells` — orchestrator (trail + fill)
- `AddTrailCells` — GPS points → H3 cell IDs
- `AddLoopFillCells` — detect loops, fill interiors
- `ExtractLoops` / `FindClosureLoops` — loop detection (path self-intersection)
- `BuildRepairedPolygon` — NTS polygon from loop points
- `DeduplicatePolygons` / `IsDuplicateOf` — overlap detection
- `FillPolygonInteriors` — H3 polyfill via NTS

**TerritoryService decomposition:**
- `ProcessClaim` orchestrator → `ValidateClaim`, `CreateClaimEntity`, `AssignCells`
- Cell assignment → `IsOnCooldown`, `CreateTransfer`, `UpdateExistingCell`, `CreateNewCell`
- Stats → `UpdateUserStats`, `UpdateStreak`, `DecrementVictimHexCounts`

### 3. Frontend Journey Feature Refactor

**New classes extracted:**
- `LoopDetector` — static class mirroring backend `ExtractLoops` algorithm (counts loops client-side)
- `HexTerritoryManager` — manages hex loading/state (`loadUserOwnHexes`, `loadWideArea`, `loadViewport`, `updateFromCells`, `addCapturedHexes`)
- `CelebrationDialog` — standalone widget (was inline in journey_screen)

**JourneyScreen decomposition:**
- Extracted widgets: `_CircleButton`, `_HexOwnerSheet`, `_StatsBar`, `_BottomControls`
- Map build split: `_buildMap`, `_buildTileLayer`, `_buildOtherPlayerHexes`, etc.

### 4. H3 Resolution Change (10 → 11)

Bumped from resolution 10 (~65m cells) to resolution 11 (~29m edge, ~2,150m² area). Cells feel more "earnable" per walk — a short walk captures meaningful territory. Resolution 10 cells were too large for satisfying single-walk claims.

### 5. Constants Consolidation

All magic numbers eliminated. `GameConstants` now contains:
- `MinLoopPoints = 20` — minimum path points before loop detection kicks in
- `LoopSkipNeighbors = 10` — skip nearby points when searching for loop closure
- `DeduplicationOverlapThreshold = 0.80` — two polygons sharing >80% area are considered duplicates
- `MaxPreviewPathLength = 10_000` — path preview endpoint limit
- `MinPointsForPolygon = 4` — minimum points to attempt polygon construction
- `MinFillAreaSquareMeters = 5_000.0` — loops smaller than 5,000m² only get trail cells (was 30,000)
- `CellCooldownHours = 5.0` — cell can't be re-stolen within 5 hours
- Removed: `MinIntersectionRatio` (was 0.51 — the 51% rule)

## Decisions Made

- **Algorithm**: 2-rule system (trail + center-inside-loop). No boundary overlap.
- **Resolution 11**: Smaller cells = more satisfying gameplay loop per walk
- **Min fill area reduced**: 5,000m² (down from 30,000m²) — because smaller cells at res 11 mean loops produce fewer cells; low threshold keeps fill viable for reasonable-sized walks
- **Cell cooldown**: 5 hours before a cell can be stolen again (anti-grief)
- **Static factories on ClaimResult**: cleaner than constructor overloads

## Merge to Main

- Committed as `d00a036` on `dev/hex-map-features`
- Merged to `master` (commit `8e5d800`) via `--no-ff`
- Both branches pushed to GitHub
- PR description: "Major SOLID refactor: remove 51% boundary rule, simplify hex capture to trail+interior, split all services into interfaces, extract controllers, one class per file, all methods ≤40 lines. H3 resolution bumped to 11. Frontend journey feature decomposed into LoopDetector, HexTerritoryManager, CelebrationDialog."

## Open Questions

- Need real-device testing to confirm resolution 11 feels right
- 5,000m² min fill area — does this produce too many filled hexes for small loops?
- Cell cooldown (5h) — is this balanced for competitive play?

## Next Steps

- Real-device testing with resolution 11 cells
- Connect achievements to real progress data
- Implement push notifications for stolen cells
