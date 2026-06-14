---
id: 79
type: decision
title: Flutter Over Native and MAUI for Mobile
date: 2026-05-27
project: my-loop
feature: feat-territory-capture
status: active
author: robin
tags: [flutter, mobile, cross-platform, technology-choice]
---

# Context
Need a cross-platform mobile framework for iOS + Android. Team is proficient in C#/.NET. App requires: continuous GPS tracking, custom map rendering with 10,000+ colored polygons, beautiful UI (Uber/Duolingo level), smooth 60fps performance.

# Decision
Use **Flutter** (Dart) for the mobile app. Single codebase for iOS and Android.

# Alternatives Considered
- **.NET MAUI**: Leverages team's C# expertise, but ecosystem for geo/maps/background tracking is immature. Fewer battle-tested plugins. Smaller community. Map rendering performance unknown at scale.
- **React Native**: Good Mapbox integration, but background location is notoriously painful. Bridge overhead for heavy map rendering. JavaScript single-thread limitations.
- **Native (Swift + Kotlin)**: Best possible GPS/battery performance. But doubles development effort, doubles maintenance, doubles bug surface. Only justified at Uber's scale.

# Consequences
- Dart syntax is very similar to C# (typed, OOP, async/await, generics) — low learning curve
- Best-in-class custom rendering via Skia engine (smooth hex tile animations)
- `flutter_map` handles vector tile overlays efficiently
- `flutter_background_geolocation` (transistorsoft) is battle-tested for GPS tracking
- Single codebase: one team, one PR, one test suite
- Trade-off: slightly worse raw GPS performance vs native, but negligible for this use case
- Trade-off: must learn Dart (but it's essentially C# with different keywords)

# Related
- [[feat-territory-capture]]
- [[ses-2026-05-27-project-kickoff-architecture-decisions]]
