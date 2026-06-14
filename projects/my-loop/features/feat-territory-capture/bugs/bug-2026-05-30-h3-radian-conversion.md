---
type: bug
title: "H3 LatLng Expects Radians — All Claims Generated Wrong Cell IDs"
date: 2026-05-30
project: my-loop
feature: feat-territory-capture
status: resolved
severity: critical
author: robin
tags: [h3, radian, coordinate-conversion, data-corruption]
files:
  - path: api/MyLoop.Api/Services/HexGridService.cs
    role: modified
---

## Summary

`GetTrailCells()` passed raw GPS degrees to `H3Index.FromLatLng(new LatLng(lat, lng), res)`. The `pocketken.H3` library's `LatLng` struct stores coordinates in **radians** internally. Passing degrees (e.g., 12.97 instead of 0.2264 radians) produced H3 cell IDs at completely wrong geographic locations.

## Impact

- **All 67 cells** claimed by user "Parth" (Bangalore, India) were stored with coordinates near Japan/Pacific Ocean (23.2°N, 125.8°E)
- Map showed hexes in the wrong location (user reported "my hexes are near Japan")
- Data corruption: invalid cell IDs, invalid boundaries, invalid center coordinates

## Root Cause

```csharp
// HexGridService.cs — GetTrailCells()

// BEFORE (BUG): degrees treated as radians
var index = H3Index.FromLatLng(new LatLng(point[0], point[1]), resolution);

// AFTER (FIX): explicit conversion
var latRad = point[0] * Math.PI / 180.0;
var lngRad = point[1] * Math.PI / 180.0;
var index = H3Index.FromLatLng(new LatLng(latRad, lngRad), resolution);
```

## Why Only GetTrailCells Was Affected

| Method | Input to H3 | Affected? |
|--------|------------|-----------|
| `GetTrailCells` | Direct `new LatLng(lat, lng)` from GPS path | **YES** — was passing degrees |
| `FillPolygon` | NTS `ntsPolygon.Fill(resolution)` extension | No — NTS extension handles conversion internally |
| `GetCellCenter` | `index.ToLatLng()` (output, not input) | No — returns `LatitudeDegrees` property |
| `BuildHexBoundary` | Takes degrees directly, no H3 call | No — pure trig, not H3 |

## Verification

Standalone test confirmed:
- **Fixed**: `(12.97°, 77.59°)` → radians → Cell center `(12.97°, 77.59°)` — within 0.001° tolerance ✓
- **Old bug**: `(12.97°, 77.59°)` passed raw → Cell center `(23.22°, 125.84°)` — Japan ✗

## Resolution

1. Fixed `GetTrailCells` to convert degrees → radians before H3 lookup
2. Deleted all 67 invalid cells from `TerritoryCells` table
3. Reset user's `HexCount` to 0
4. User needs to re-walk to generate correct claims

## Lesson

Always check whether a geospatial library expects degrees or radians. The `pocketken.H3` NuGet `LatLng` struct:
- Constructor: takes **radians**
- `.LatitudeDegrees` / `.LongitudeDegrees` properties: return **degrees** (multiply by 180/π)
- This is documented in the H3 spec (H3 core library uses radians everywhere) but easy to miss with the .NET wrapper
