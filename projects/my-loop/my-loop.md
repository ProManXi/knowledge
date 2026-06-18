---
type: project
name: my-loop
title: MyLoop — Real-World Territory Capture Game
status: active
author: robin
tags: [mobile-game, geospatial, flutter, dotnet, h3, territory]
---

# MyLoop

A mobile game where players capture real-world territory by physically completing loops (walking). Territory is represented as H3 hexagonal cells (~65m resolution). Overlapping claims steal territory. City-wide daily leaderboards drive competition. Future: group/team play.

**Stack**: Flutter 3.44.0 (mobile/web) + .NET 10 minimal API (backend) + PostgreSQL 18 (geo) + pocketken.H3 (hex computation) + flutter_map + OSM tiles (map rendering) + ngrok (remote testing tunnel)

## Features

```dataview
TABLE status FROM "projects/my-loop/features" WHERE role = "hub" SORT file.name ASC
```

## Systems

```dataview
TABLE status FROM "projects/my-loop/systems" SORT file.name ASC
```
