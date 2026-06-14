---
id: 78
type: decision
title: H3 Hexagonal Grid for Territory Representation
date: 2026-05-27
project: my-loop
feature: feat-territory-capture
status: active
author: robin
tags: [h3, geospatial, territory, architecture]
---

# Context
Need to represent claimed territory on a map. Users complete physical loops and claim the enclosed area. Multiple users' territories can overlap/conflict. Need efficient computation of "which cells are inside this polygon" and "transfer cells from owner A to owner B."

# Decision
Use Uber's H3 hexagonal grid system at **resolution 10** (~65m cell width, ~4,234 m² per cell). Territory = set of H3 cell IDs (64-bit integers) owned by a user.

# Alternatives Considered
- **Arbitrary smooth polygons**: Beautiful visual result, but polygon intersection/subtraction at scale (thousands of users) is O(n²) complex. PostGIS `ST_Intersection` on arbitrary shapes is expensive and produces edge cases (slivers, degenerate geometries). Would require computational geometry library on every claim.
- **Square grid**: Simpler than hex but looks worse visually (aliasing on diagonals). Hex grids have uniform adjacency (6 neighbors, all equidistant).
- **Higher resolution (H3 res 11, ~25m)**: 4x more cells to store/render. Diminishing returns for "50m precision" requirement. Increases storage, tile rendering cost, and query time.
- **Lower resolution (H3 res 9, ~174m)**: Too coarse. A single city block would be 1-2 cells. Unsatisfying gameplay.

# Consequences
- Territory is stored as simple integer sets — fast SET operations for conflict resolution
- `h3_polygon_to_cells()` in PostGIS converts any polygon to cell list in ~50-200ms
- No complex polygon intersection math needed — "cutting" is just reassigning cell ownership
- Visual aesthetic: colored hex tiles look intentionally game-like (Risk/Civilization style)
- All H3 computation lives server-side (no Dart/Flutter H3 library exists)
- ~50,000-150,000 cells per city (500km²) — manageable for queries and tile rendering
- Client sends raw polygon, server converts to H3 — clean separation of concerns

# Related
- [[feat-territory-capture]]
- [[ses-2026-05-27-project-kickoff-architecture-decisions]]
