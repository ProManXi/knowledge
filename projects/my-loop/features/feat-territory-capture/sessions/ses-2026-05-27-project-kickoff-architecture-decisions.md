---
type: session
title: Project Kickoff — Architecture & Technology Decisions
date: 2026-05-27
project: my-loop
feature: feat-territory-capture
status: complete
author: robin
continues-in: "[[ses-2026-05-28-continued-architecture-refinement]]"
tags: [kickoff, architecture, planning, technology-stack]
files: []
---

# What I Did
- Defined the core concept: real-world territory capture game using H3 hexagonal grid
- Evaluated and selected full technology stack (Flutter, .NET Core 8, PostgreSQL/PostGIS/h3-pg, Martin, MapLibre)
- Defined 4 MVP features: territory capture, live map, leaderboard, profile & avatars
- Established architecture principles: client-heavy/server-lazy, eventually consistent, modular monolith
- Identified key constraints: H3 resolution 10 (~65m), "When In Use" GPS only, daily leaderboard refresh
- Researched H3, Flutter background geo, vector tile serving, loop detection algorithms

# Problems I Hit
- No official H3 library for Dart/Flutter → decision: all H3 computation server-side, client sends polygon only
- flutter_map struggles at 10,000+ individual polygons → decision: use vector tiles (Martin) instead of client-side polygon rendering
- Apple scrutinizes "Always" location permission → decision: "When In Use" only, track only during active capture with foreground notification

# Decisions Made
- **Flutter over .NET MAUI / React Native / Native** → see [[dec-flutter-over-native-and-maui]]
- **PostgreSQL + PostGIS over SQL Server** → see [[dec-postgresql-postgis-over-sql-server]]
- **H3 hex grid over arbitrary polygons** → see [[dec-h3-hex-grid-for-territory]]
- **Modular monolith, not microservices** for backend
- **MapLibre (free)** over Google Maps ($7/1000 loads)
- **Walking only** for MVP (cycling/driving post-validation)
- **Pre-made avatars** for MVP (custom Bitmoji-style post-MVP)
- **Daily leaderboard refresh** at 00:00 local time (no real-time rankings)
- **Last-writer-wins** conflict resolution for territory disputes
- **Eventually consistent** (1-3 min delay acceptable for territory updates)

# What I Chose NOT To Do — and Why
- **Real-time WebSockets**: Unnecessary complexity. Polling every 60s is fine for "minutes-delayed" territory updates.
- **Microservices from day 1**: Kills velocity. Modular monolith with clean module boundaries; extract when proven necessary.
- **24/7 background GPS tracking**: Battery killer + Apple rejection risk. Only track during active capture.
- **Arbitrary smooth polygons**: Computationally brutal at scale. H3 hexes are simpler, faster, and look intentionally game-like.
- **Redis for leaderboard**: Overkill for daily refresh. Simple DB snapshot table suffices for MVP.
- **Google Maps**: Expensive at scale. MapLibre is free and open-source with equivalent functionality.

# Next Steps
- Set up project scaffolding: Flutter app + .NET Core 8 API + Docker Compose
- Implement Firebase Auth integration
- Build GPS tracking prototype on a real device (test accuracy, battery drain)
- Set up PostgreSQL + PostGIS + h3-pg in Docker
- Prototype: walk a loop → submit polygon → get H3 cells back

# Related
- [[feat-territory-capture]]
- [[dec-flutter-over-native-and-maui]]
- [[dec-postgresql-postgis-over-sql-server]]
- [[dec-h3-hex-grid-for-territory]]
