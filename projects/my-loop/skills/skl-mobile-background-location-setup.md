---
type: skill
title: "Mobile background location: foreground service vs ACCESS_BACKGROUND_LOCATION"
project: my-loop
features: [feat-territory-capture]
category: gotchas
status: active
author: robin
date: 2026-06-15
derived-from: "[[ses-2026-06-15-babysit-and-review-open-prs]]"
repo-path: ".claude/skills/mobile-background-location/SKILL.md"
tags: [gps, location, android, ios, foreground-service, compliance, geolocator]
---

# Mobile background location: foreground service vs ACCESS_BACKGROUND_LOCATION

## When to Activate
Reviewing or writing any Flutter/geolocator code that must keep receiving GPS
positions while the app is backgrounded or the screen is off (walk tracking,
fitness, navigation).

## Rules / Checklist
- **Android — prefer a foreground service, not background-location permission.**
  Configure geolocator's `AndroidSettings.foregroundNotificationConfig` so it runs
  a location-typed foreground service (visible notification). This keeps the stream
  alive with the screen off and **does not require `ACCESS_BACKGROUND_LOCATION`** —
  omitting that permission keeps you out of Google Play's background-location
  declaration/review policy. Declare `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_LOCATION`.
- **iOS — `allowBackgroundLocationUpdates: true` throws at runtime without
  `UIBackgroundModes: location` in `Info.plist`.** CI/unit tests will not catch
  this. When reviewing a PR that sets it, **verify `Info.plist` directly** (also
  needs `NSLocationWhenInUseUsageDescription`; add `NSLocationAlwaysAndWhenInUseUsageDescription`
  if you want "Always"). Set `pauseLocationUpdatesAutomatically: false` so updates
  don't stop when the device is still, and `showBackgroundLocationIndicator: true`.
- **Make the settings selection pure and testable.** A `buildSettings(platform)`
  function that returns the right `AndroidSettings`/`AppleSettings`/`LocationSettings`
  is unit-testable per platform; the actual background behavior is not and needs
  on-device QA (confirm the FGS notification clears when tracking stops; watch
  battery from `enableWakeLock: true`).
- **Store consoles (not code):** App Store Connect App Privacy + Play Console Data
  safety must declare location collection before release — flag these; they can't be
  verified from the repo.

# Related
- [[my-loop]]
- [[ses-2026-06-15-babysit-and-review-open-prs]]
- [[feat-territory-capture]]
