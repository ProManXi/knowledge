---
type: pr-review
title: "Show the player's own hexes on the map while offline"
project: my-loop
feature: feat-territory-capture
status: changes-requested
kind: bugfix
author: robin
date: 2026-06-18
tracker: github
ref-id: 44
ref-url: "https://github.com/WarPro-Org/my_loop/pull/44"
reviews: "[[bug-2026-06-18-offline-own-hexes-not-rendered]]"
files:
  - path: mobile/lib/features/journey/hex_territory_manager.dart
    role: modified
  - path: mobile/lib/shared/services/territory_cache.dart
    role: created
  - path: mobile/lib/shared/models/territory_cell.dart
    role: modified
  - path: mobile/test/territory_offline_cache_test.dart
    role: created
tags: [offline, cache, hex-rendering, review, issue-33]
---

# What This PR Does
Makes the map remember the hexes you already own, so when your phone has no internet
the Start Journey map still shows your territory instead of a blank grid.

# Why It Was Needed
The map only ever asked the server for your owned hexes. With no internet that request
failed silently, and the code had nowhere else to look — so your territory disappeared
until you were back online. Authored by aman (amanshukla446).

# How It Works
```mermaid
flowchart LR
  A[Open Start Journey map] --> B{Server reachable?}
  B -- yes --> C[Fetch owned hexes] --> D[Draw on map] --> E[Save copy to disk]
  B -- no --> F[Read last saved copy from disk] --> D
```
A new `TerritoryCache` writes the owned hexes to a small JSON file after each
successful fetch, and reads them back when the fetch fails. The file is tagged with the
user's id so a second account on the same phone can never see the first account's
territory offline. It's wiped on sign-out and account deletion.

# Review Findings
| Severity | Finding | Resolved? |
|----------|---------|-----------|
| Verified | `toJson` ↔ `fromJson` fully symmetric (all 8 keys/types round-trip) | n/a — confirmed correct |
| Verified | Cross-user `decode`/`load` guard correct; owned cells never evicted from `allCells`, so the `userOwnCellIds.isEmpty` fallback guard doesn't under-render | n/a — confirmed correct |
| Verified | Test fails-without-fix (offline restore), cross-user, empty-cache; CI green | n/a — confirmed correct |
| Requested change | Offline fallback runs on **any** thrown error via a blanket `catch (_)`; a 5xx / parse bug is masked behind stale cache with no log. Narrow to the existing `isServerUnreachable(e)` primitive (#19/#43) and log/rethrow unexpected errors | ⏳ requested, awaiting push |
| Minor | Concurrent `save` to the one cache file could interleave (low risk; `decode` self-heals) | open, optional |
| Minor | Cached `decayProgress`/cooldown render stale offline — confirm by-design | open, confirm |

# Linked Bug / Feature
Fixes [[bug-2026-06-18-offline-own-hexes-not-rendered]] (issue #33) on the Territory
Capture feature. Same offline-cache lineage as the profile fix
[[bug-2026-06-15-offline-restore-cross-user-identity]] (issue #19).

## Evolution
- 2026-06-18 — PR reviewed; one change requested (narrow blanket catch to
  `isServerUnreachable`), strengths and two minor notes recorded. Not yet approved.

# Related
- [[feat-territory-capture]]
- [[bug-2026-06-18-offline-own-hexes-not-rendered]]
