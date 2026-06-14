---
id: 80
type: decision
title: PostgreSQL + PostGIS Over SQL Server
date: 2026-05-27
project: my-loop
feature: feat-territory-capture
status: active
author: robin
tags: [postgresql, postgis, h3-pg, database, geospatial]
---

# Context
Need a database for: storing H3 territory cells (millions of rows), converting polygons to H3 cell sets, serving vector tiles via Martin, geospatial indexing. Team is proficient with SQL Server/SSMS.

# Decision
Use **PostgreSQL 16 + PostGIS 3.4 + h3-pg extension**. Access from .NET via Npgsql + EF Core.

# Alternatives Considered
- **SQL Server (SSMS)**: Team's comfort zone. Has spatial types (`geography`, `geometry`). But:
  - **No h3-pg equivalent** — would need to compute H3 externally and round-trip back to DB
  - **Martin doesn't support SQL Server** — would need a separate tile generation pipeline
  - **PostGIS spatial functions are faster** and more complete for geo operations
  - **Licensing cost** vs PostgreSQL (free)
  - Spatial indexes exist but benchmarks show PostGIS GiST indexes outperform for complex geo queries

# Consequences
- `h3_polygon_to_cells(polygon, 10)` runs natively in the database — no application round-trip
- Martin reads directly from PostGIS and serves vector tiles — zero custom tile generation code
- EF Core + Npgsql provides identical developer experience to SQL Server (same migrations, same LINQ, same patterns)
- PostGIS GiST indexes for fast spatial queries
- Team needs to learn: `psql` instead of SSMS, PostgreSQL syntax differences (minor)
- Docker Compose for local dev (no SQL Server installation needed)
- Free at any scale — no licensing concerns as user base grows

# Related
- [[feat-territory-capture]]
- [[ses-2026-05-27-project-kickoff-architecture-decisions]]
