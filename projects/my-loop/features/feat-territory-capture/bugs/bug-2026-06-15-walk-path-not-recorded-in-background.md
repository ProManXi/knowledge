---
type: bug
title: "Walk path stops recording when the app is backgrounded / screen off"
project: my-loop
feature: feat-territory-capture
status: resolved
severity: high
author: robin
date: 2026-06-15
tags: [gps, location, background, foreground-service, ios, android, issue-20]
files:
  - path: mobile/lib/shared/services/location_service.dart
    role: root-cause
  - path: mobile/android/app/src/main/AndroidManifest.xml
    role: modified
---

# Description
Issue #20 — the walked path was not recorded while the app was backgrounded or the
screen was off. Reviewed/approved via PR #26.

# Steps to Reproduce
1. Start a walk (capture mode).
2. Lock the phone / switch apps mid-walk.
3. Walk a route, return to the app.

# Expected Behavior
The recorded path and the hexes along the real route are continuous.

# Actual Behavior
The OS suspended position delivery once the app left the foreground. The path drew
last-known → resume as a single straight line, and the hexes along the real route
were lost.

# Root Cause
`startTracking()` passed a bare `LocationSettings` to
`Geolocator.getPositionStream`. With no platform-specific background configuration,
the OS suspends the position stream when the app is not foreground.

# Fix
Resolved via PR #26 (approved; `8d9c756`, head `fa4040c3`):
- New pure `buildTrackingSettings(LocationPlatform)`:
  - **Android** → `AndroidSettings` with a `foregroundNotificationConfig`, so
    geolocator runs a location-typed **foreground service** and keeps streaming
    with the screen off.
  - **iOS** → `AppleSettings` with `allowBackgroundLocationUpdates: true`,
    `pauseLocationUpdatesAutomatically: false`, `showBackgroundLocationIndicator: true`.
  - **web/other** → plain `LocationSettings` (no regression).
- `AndroidManifest.xml` adds `ACCESS_FINE/COARSE_LOCATION`, `FOREGROUND_SERVICE`,
  `FOREGROUND_SERVICE_LOCATION`. Deliberately **omits** `ACCESS_BACKGROUND_LOCATION`
  — a foreground service does not need it and omitting it avoids Google Play's
  background-location declaration/review policy.
- iOS `Info.plist` already declares `UIBackgroundModes: [location]` + both usage
  descriptions (verified during review — required or `allowBackgroundLocationUpdates`
  throws at runtime).

## Evolution
- 2026-06-15 — Captured from PR #26 review (issue #20). Fix approved + verified; resolved.

# Related
- [[feat-territory-capture]]
- [[pr-2026-06-15-background-walk-tracking-foreground-service]]
