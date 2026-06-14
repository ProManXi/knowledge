---
type: session
title: Perfect Hex Boundaries, GPS Drift Fix, Map Theme Toggle
date: 2026-05-29
project: my-loop
feature: feat-territory-capture
status: complete
author: robin
continues-from: "[[ses-2026-05-29-ui-polish-api-refactor]]"
continues-in: "[[ses-2026-05-30-h3-radian-fix-claim-refactor]]"
tags: [hex-math, gps-filtering, satellite-map, labels, badge-animation, profile-layout]
files:
  - path: api/MyLoop.Api/Services/H3Service.cs
    role: modified
  - path: mobile/lib/features/journey/journey_screen.dart
    role: modified
  - path: mobile/lib/features/journey/journey_controller.dart
    role: modified
  - path: mobile/lib/features/profile/user_profile_screen.dart
    role: modified
  - path: mobile/lib/shared/widgets/hex_trophy.dart
    role: modified
---

## What Was Built

### 1. Perfect Hex Boundary Generation (`GetPerfectHexBoundary`)
- Added to `H3Service.cs` — generates visually-perfect regular hexagons on any map at any latitude
- Uses `cos(latitude)` correction: converts 25m radius to degree offsets for both lat AND lng
- H3 still handles cell selection (which hexes to capture) — we override the visual boundary
- Every hex worldwide is exactly 25m radius (center-to-vertex), flat-top orientation
- 7-point polygon (6 vertices + closing point)

### 2. Minimum Loop Area Check
- `CalculatePolygonArea()` — Shoelace formula in metric coordinates (projected via centroid)
- `MinFillAreaM2 = 30,000` — loops smaller than this only get trail cells (no interior fill)
- Corrected `CellAreaM2` from 4,234 to 15,047 (actual H3 res-10 area)

### 3. GPS Drift Fix (stationary false-distance accumulation)
**Root cause**: `_onPosition` in journey_controller.dart blindly added every GPS update to path and accumulated distance. GPS jitter of 5-15m when stationary caused 9+ meters to appear immediately.
**Fix**: Multi-layer filtering:
- Reject readings with accuracy > 25m (unreliable)
- Noise floor = `accuracy.clamp(8, 25)` for moving, `accuracy.clamp(10, 25)` for stationary
- Stationary detection: `speed < 0.3 m/s` triggers stricter threshold
- Below noise floor: update live marker only, don't record to path/distance
- First point always accepted (no filtering on empty path)

### 4. Map Theme Toggle
- `_useSatellite` state variable in `_JourneyMapState`
- Top-right floating button (dark_mode / satellite_alt icon)
- Satellite: ESRI World Imagery + ESRI Reference labels overlay
- Dark: CartoDB Dark All (includes labels natively)

### 5. Map Labels
- ESRI Reference layer (`World_Boundaries_and_Places`) overlaid on satellite tiles
- Only rendered when satellite mode active (CartoDB dark already has labels)

### 6. Profile Layout Redesign
- Avatar (56px) + Name in horizontal row (vertically centered = name at avatar's diameter midpoint)
- Tag/title below avatar with indent
- Badge on right: enlarged to 90px

### 7. Badge Animation Enhancement
- `TickerProviderStateMixin` with dual controllers (pulse 2s + shimmer 3s)
- Breathing glow: pulsing `BoxShadow` around badge
- Scale pulse: 6% (up from 4%)
- Rotating shimmer: light sweep orbiting inside hexagon (3s period)
- Painter accepts `shimmerPhase` for rotating white dot effect

## Decisions Made
- **Keep H3 for game logic**: H3 ensures globally unique cell IDs, neighbor lookups, hierarchy. Only replaced visual boundary.
- **Fixed hex size worldwide**: 25m radius. No adaptive sizing. Consistent fair gameplay.
- **Min fill area 30,000m²**: ~2 H3 cells. Small loops (< ~175m diameter circle) only get trail hexes.
- **GPS filtering by accuracy AND speed**: Combined approach handles both bad-signal readings and stationary jitter.

## Next Steps
- Configure Apple Sign-In and Google Sign-In (federated auth via Firebase)
- Test on real iPhone with GPS movement
- Seasons/titles system design
- Territory revenge/fight mechanic
