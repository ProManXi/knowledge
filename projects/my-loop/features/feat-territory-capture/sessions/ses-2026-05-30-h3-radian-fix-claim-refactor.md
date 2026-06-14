---
type: session
title: H3 Radian Bug Fix, Map Race Condition, Claim Flow Refactor, Auto-Login
date: 2026-05-30
project: my-loop
feature: feat-territory-capture
status: complete
author: robin
continues-from: "[[ses-2026-05-29-hex-perfection-gps-fix]]"
continues-in: "[[ses-2026-05-31-solid-refactor-algorithm-simplification]]"
tags: [h3-bug, radian-conversion, map-state, race-condition, auto-login, claim-flow, api-endpoints, hex-history]
files:
  - path: api/MyLoop.Api/Services/HexGridService.cs
    role: modified
  - path: api/MyLoop.Api/Services/TerritoryService.cs
    role: modified
  - path: api/MyLoop.Api/Services/ITerritoryService.cs
    role: modified
  - path: api/MyLoop.Api/Controllers/TerritoryController.cs
    role: modified
  - path: api/MyLoop.Api/Models/Responses.cs
    role: modified
  - path: mobile/lib/features/journey/journey_screen.dart
    role: modified
  - path: mobile/lib/features/home/home_tab.dart
    role: modified
  - path: mobile/lib/features/auth/login_screen.dart
    role: modified
  - path: mobile/lib/shared/services/api_service.dart
    role: modified
  - path: mobile/lib/shared/services/user_state.dart
    role: modified
  - path: mobile/lib/shared/widgets/big_button.dart
    role: modified
  - path: mobile/ios/Runner/Info.plist
    role: modified
  - path: mobile/pubspec.yaml
    role: modified
  - path: scripts/bump_build.ps1
    role: created
---

## What Was Built

### 1. Critical Bug Fix: H3 Radian Conversion (Root Cause of "Hexes Near Japan")

**Problem**: `GetTrailCells()` in `HexGridService.cs` passed raw GPS degrees to `H3Index.FromLatLng(new LatLng(lat, lng), res)`. The `pocketken.H3` library's `LatLng` constructor expects **radians**, not degrees. 

**Impact**: Bangalore coordinates (12.97°, 77.59°) interpreted as radians resolved to H3 cells at (23.22°, 125.84°) — the Pacific Ocean near Japan. All 67 of Parth's claimed cells were garbage data at wrong locations.

**Fix**: 
```csharp
// Before (BUG):
var index = H3Index.FromLatLng(new LatLng(point[0], point[1]), resolution);

// After (FIXED):
var latRad = point[0] * Math.PI / 180.0;
var lngRad = point[1] * Math.PI / 180.0;
var index = H3Index.FromLatLng(new LatLng(latRad, lngRad), resolution);
```

**Verification**: Created standalone test project confirming:
- Fixed: `(12.97, 77.59)` → Cell center `(12.97, 77.59)` — PASS
- Old bug: Same input → `(23.22, 125.84)` — Japan — confirmed

**Note**: `FillPolygon()` was NOT affected — it uses NTS `ntsPolygon.Fill()` which handles H3 conversion internally via the NTS extension. `BuildHexBoundary()` uses `LatitudeDegrees`/`LongitudeDegrees` (already degrees from `ToLatLng()`). Only `GetTrailCells` had the bug.

**DB Cleanup**: Deleted all 67 of Parth's invalid cells. Reset HexCount to 0.

### 2. Map Hex State Race Condition Fix

**Problem**: `_updateHexState()` (from viewport refresh every 30s) overwrote `_myHexBoundaries` with only cells visible in the current viewport. When the viewport refresh ran AFTER `_loadUserOwnHexes()` completed, it replaced the user's complete hex list with a subset.

**Fix**: Split into two independent state variables:
- `_userOwnHexBoundaries` — authoritative list from `GET /api/territories/user/{userId}` (ALL user hexes, no viewport limit)
- `_otherHexBoundaries` — from viewport query (other players' hexes only)
- `_updateHexState()` now only updates `_otherHexBoundaries`, never touches `_userOwnHexBoundaries`
- `_userOwnCellIds` (Set) tracks which cells came from the user endpoint to avoid duplicates

### 3. New Backend Endpoints

**`GET /api/territories/user/{userId:guid}`**
- Returns ALL `TerritoryCellResponse` owned by userId, no viewport/bounding-box restriction
- Used by map to always show user's hexes regardless of where they're standing
- Implementation: queries `TerritoryCells WHERE OwnerId == userId`, deserializes BoundaryJson

**`GET /api/territories/claims/{userId:guid}`**
- Returns `List<ClaimHistoryEntry>` ordered by date descending
- Fields: `ClaimId`, `CellCount`, `AreaM2`, `Date`
- Used by home page "Hex History" section

### 4. Claim Flow Architectural Refactor

**Problem**: `_BottomControls` was a `ConsumerWidget` doing async work (API calls, setState, showDialog) with a stale `BuildContext` that could be unmounted by the time async work completed.

**Fix**: Moved ALL claim logic to `_JourneyScreenState._onStopCapture()`:
- Reads fresh state via `ref.read(journeyControllerProvider)` (not stale closure)
- Uses `_JourneyScreenState.context` for dialogs (lifecycle-stable)
- `_BottomControls` is now a pure `StatelessWidget` with callbacks
- `BigButton.onPressed` made nullable (`VoidCallback?`) to support disabled/submitting state
- Error handling: replaced `catch (_) {}` with visible error snackbar

### 5. Full Data Refresh After Capture

After `_onStopCapture` completes:
1. `showCapturedHexes(boundaries)` — immediate green flash on map
2. Optimistic badge update (`+cellCount`)
3. `forceReloadHexes()` → `_loadUserOwnHexes()` + `_refreshViewportHexes()`
4. `getUser()` from API
5. `getLeaderboard()` for rank
6. `updateStats(hexCount, streak, distanceKm, rank)` — all 4 fields
7. `_showCelebration()` dialog

### 6. Auto-Login (Firebase Session Persistence)

**LoginScreen** converted from `ConsumerWidget` → `ConsumerStatefulWidget`:
- `initState` → `addPostFrameCallback` → checks `authService.currentUser`
- If non-null: shows spinner, calls `_routeAfterAuth(uid)` which fetches user + rank + routes to `/home`
- Firebase Auth persists session automatically — no code needed for token storage

### 7. Hex History Widget Rewrite

`_HexHistoryLazy` converted from `StatefulWidget` → `ConsumerStatefulWidget`:
- `_fetchHistory()` now calls real `getClaimHistory(userId)` API
- Displays: date (relative: "Today", "Yesterday", "3 days ago"), area, "+N ⬡" badge
- Error state handling (shows message instead of crashing)

### 8. iOS Build Number in App Name

- `Info.plist`: `CFBundleDisplayName` = `Myloop ($(FLUTTER_BUILD_NUMBER))`
- Shows e.g. "Myloop (4)" under the icon on iPhone
- `scripts/bump_build.ps1`: auto-increments build number, commits, pushes

### 9. Map Badge = Total Hex Count

- Removed `_myHexCount` field (was tracking viewport-only count)
- Badge now reads from `userProfileProvider.hexCount` — always DB total
- Updates immediately after capture via optimistic update + API refresh

## Decisions Made

- **Two parallel hex loads on map open**: `_loadUserOwnHexes()` (unconditional, all user hexes) + `_loadAllHexes()` (viewport-based, all players). Ensures user always sees their territory even if they captured it at a different location.
- **Map never auto-flies to hex location**: Map always centers on GPS position. If hex data is bad, this prevents flying to wrong coordinates.
- **Authoritative vs viewport state separation**: `_userOwnHexBoundaries` (from user endpoint) is never overwritten by viewport refresh. Prevents race conditions.

## Bugs Found

- H3 radian conversion (critical — all claims generated wrong cells)
- Map state race condition (viewport refresh overwrote authoritative user hex list)
- Stale context in claim flow (async work in ConsumerWidget with unmounted context)
- Hardcoded Stockholm bounding box in `_loadAllHexes` (leftover from dev)
- Badge showing viewport count instead of total (misleading when zoomed in)

## Open Questions

- Should we add a migration script that re-processes old claims with the radian fix? (Only matters if historical claim data needs to be preserved — Parth's was just deleted)
- Should `GetUserTerritories` paginate for users with thousands of hexes?

## Next Steps

- Pull on Mac, rebuild iOS, deploy to Parth's phone
- Parth does a real walk to verify end-to-end: correct coordinates, hexes appear at right location, hex history shows in home tab
- ngrok tunnel restart needed (expired)
