---
type: feature
title: "Package Builder — Living Spec"
project: volvo-digital-twin
feature: feat-package-builder
role: info
status: active
author: parth
date: 2026-11-18
tags: [package, build, jfrog]
---

# Current Architecture

### Components
- **Package Builder Service** — builds deployment packages from BOM specifications
- Fetches description files and artifacts from JFrog
- Assembles packages that Session Manager will deploy to trucks

### Known Behaviors
- Triggered by Vehicle Service
- Interacts with JFrog artifact repository

### Edge Cases
- (To be documented)

## File Map

## Integration Points
- **Vehicle Service** — receives build requests
- **JFrog** — fetches description files, XML descriptors, part data
- **Session Manager** — built package handed off for deployment

## Open Questions
- What does a "package" contain exactly?
- How are description files structured?
- Build failure handling and retry logic?

## Evolution
- 2026-11-18 — Created. High-level only.

# Related
- [[feat-package-builder]]
