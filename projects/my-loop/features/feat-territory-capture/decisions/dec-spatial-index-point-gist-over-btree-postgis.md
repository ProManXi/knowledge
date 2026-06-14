---
type: decision
title: Spatial Index — PostgreSQL native point + GiST over composite B-tree or PostGIS
date: 2026-05-28
project: my-loop
feature: feat-territory-capture
status: complete
author: robin
tags: [spatial-index, postgresql, gist, postgis, geohash, performance]
---

# Decision: Spatial Index for Territory Viewport Queries

## Context

The viewport query `GET /api/territories?bounds=...` needs to return only the hex cells visible on screen. Currently it loads ALL cells into memory and filters in C# — this is fine for dev/MVP but fails at ~5,000+ cells (a single city at H3 resolution 10 has 50,000–150,000 cells).

We need a database-level spatial index. Three options were evaluated.

## Options

### Option 1: Composite B-tree on (CenterLat, CenterLng)
Store lat and lng as two double columns with a standard composite B-tree index.

**Why it's wrong:**
B-tree sorts data by lat first, then lng within the same lat value. A bounding box query like:
```sql
WHERE lat BETWEEN 12.9 AND 13.1 AND lng BETWEEN 77.5 AND 77.7
```
Works in two steps:
1. Index scan on the lat range — efficient, returns all rows with lat in `[12.9, 13.1]` across the *entire longitude span of the city* (~thousands of rows)
2. Filter by lng — evaluated as a *post-scan condition*, not index-assisted

The lat dimension gets a fast tree traversal. The lng dimension is a filter on the already-narrowed result set. This is 1D indexing pretending to be 2D. Degrades proportionally to city width.

**Verdict: Rejected.** The user raised this concern directly and it's correct.

---

### Option 2: PostGIS `geometry(Point, 4326)` + GiST index
Add the PostGIS extension, store cell centers as `geometry` columns, index with GiST.

**Why it works:** GiST (Generalized Search Tree) is a true multi-dimensional index. Both lat and lng contribute equally to tree traversal. Viewport query uses `ST_Intersects(center, ST_MakeEnvelope(...))` — pure index operation.

**Why it's premature:**
- Requires `CREATE EXTENSION postgis` — a heavyweight extension install
- EF Core needs `Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite` NuGet + `UseNetTopologySuite()` configuration
- Full value of PostGIS (polygon operations, Martin vector tiles) only realized when we adopt Martin for tile serving — which is a separate infrastructure decision
- Adds complexity to a system that doesn't need it yet

**Verdict: Deferred.** Will become the right choice when Martin vector tiles are adopted. Adding a `geometry` column at that point is a non-breaking migration — zero wasted work now.

---

### Option 3: PostgreSQL native `point` + GiST ✅ CHOSEN
PostgreSQL ships with built-in geometric types — `point`, `box`, `polygon`, etc. — and supports GiST indexing on them natively. No extension required.

```sql
-- Column: center point (note: PostgreSQL point is (x, y) = (lng, lat))
ALTER TABLE territory_cells ADD COLUMN center point;
CREATE INDEX idx_territory_cells_center ON territory_cells USING gist(center);

-- Viewport query using box containment operator:
WHERE center <@ box '((77.5,12.9),(77.7,13.1))'
```

**Why it's right:**
- Ships with PostgreSQL — zero extension installation, zero deployment concern
- GiST on `point` = true 2D spatial index — both dimensions in the tree, no post-filtering
- Maps to `NpgsqlPoint` in .NET via Npgsql — no extra NuGet packages
- Viewport query is a single index operation: `<@` (contained-by-box operator)
- When PostGIS is added later for Martin: add a `geometry` column alongside — the `point` column stays, zero breaking changes

**Verdict: Chosen.**

---

### Option 4: Geohash (considered, not chosen now)
Geohash encodes (lat, lng) as a base-32 string where geographic proximity = shared prefix. Index with B-tree, query with prefix `LIKE 'tdr1%'`.

**Why not now:**
- Less precise than GiST at bounding-box boundaries (false positives need post-filtering)
- H3 already *is* a spatial hash — H3 resolution 3 parent cells behave like geohash buckets
- More complex to implement correctly (prefix length selection, boundary edge cases)

**Extensibility hook preserved:**
`ParentCellId` (H3 resolution 3, stored as `long`) is stored in `TerritoryCell`. This column is H3's native geohash equivalent — cells sharing the same res-3 parent are geographically clustered. If geohash-style sharding is ever needed, this column is already there.

---

## Final Schema Impact

```
TerritoryCell additions:
├── CenterLat     double   — viewport filter (kept as plain doubles too for simplicity)
├── CenterLng     double   — viewport filter
├── ParentCellId  long     — H3 res 3 parent (geohash extensibility hook)
├── PreviousOwnerId Guid?  — fast last-owner lookup (revenge feature)
└── INDEX: gist(point(CenterLng, CenterLat))  — true 2D spatial index
```

## Extensibility Path

```
Now:      CenterLat/Lng + GiST on point  →  fast 2D viewport, no extensions
Later:    + PostGIS geometry column       →  Martin vector tiles, ST_* operations  
Future:   + geohash column if needed      →  prefix-based sharding (unlikely, H3 covers this)
Always:   ParentCellId (H3 res 3)         →  H3-native hierarchical queries, partition pruning
```

## Related Decisions
- [[dec-postgresql-postgis-over-sql-server]] — why PostgreSQL was chosen over SQL Server
- [[dec-h3-hex-grid-for-territory]] — why H3 resolution 10
