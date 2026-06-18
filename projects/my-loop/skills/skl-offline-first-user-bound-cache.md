---
type: skill
title: "Offline-First User-Bound Cache"
project: my-loop
features: [feat-profile, feat-territory-capture, feat-progression]
category: architecture
status: active
author: robin
date: 2026-06-18
derived-from: "[[ses-2026-06-18-review-loop-offline-prs]]"
repo-path: ".claude/skills/offline-first-user-bound-cache/SKILL.md"
tags: [offline, cache, riverpod, flutter, cross-user, durability]
---

# Offline-First User-Bound Cache

A repeatable pattern for "show last-known data when the server is unreachable" in MyLoop.
Used for the offline profile (`ProfileCache`, #19), owned hexes (`TerritoryCache`, #33),
and home cards (`GameStateCache`, #34). When a new screen goes blank offline because its
only data source is a server call, add one of these — don't special-case the widget.

## When to Activate
- A screen/card shows nothing offline because its data comes only from an API call.
- You're adding a new offline fallback or a file-backed cache on the Flutter client.
- Reviewing a PR that adds a cache, an offline branch, or a `getX() returns null offline`.

## The Pattern (mirror `ProfileCache`)
A **static, file-backed** service in `mobile/lib/shared/services/{name}_cache.dart`:
- **`save(userId, payload)`** — write JSON to the app documents dir on a *successful*
  fetch. Best-effort: wrap I/O in try/catch and **log + swallow** (caching never breaks
  the screen). Never cache an empty `userId`.
- **`load(userId)`** — read it back, returning `null` if absent/unreadable/another user's.
- **`clear()`** — delete the file. **Wire into every `ProfileCache.clear()` call site**
  (sign-out + account-deletion in `auth_service.dart`, `home_screen.dart`,
  `profile_screen.dart`). Missing one leaks data across accounts.
- **Pure `encode` / `decode`** statics so the codec is unit-testable without the filesystem.
- Store the **raw server JSON shape** the consumer already parses (add a model `toJson`
  that round-trips its `fromJson` exactly) — no new serialization to drift.

## Non-Obvious Rules (these are what reviews catch)
1. **Cross-user binding guard.** Bind the cache to the server `userId` and reject a
   mismatch in `load`/`decode`. Without it, a second account on a shared device inherits
   the first user's data offline. This is the #1 thing to verify.
2. **Restore only when you don't already have fresher data.** Guard the restore (e.g.
   `if (userOwnCellIds.isEmpty)`) so a live/partial load isn't clobbered by stale cache.
3. **Discriminate offline from real errors.** Restore-from-cache should fire on genuine
   connectivity loss, not every exception. Use the existing `isServerUnreachable(e)`
   primitive (`api_service.dart`) and **log/rethrow** non-connectivity failures — a blanket
   `catch (_)` masks a 5xx/parse bug behind stale cache. (If the API method already
   collapses offline to a *logged* `null` — like `getGameState` — consuming that null is
   fine; the discrimination + log already happened at the source.)
4. **Scope the restore.** Only restore the slices in scope (e.g. missions + exploration,
   not achievements) — stale state that misleads the user is worse than an empty card.
5. **Best-effort writes never throw.** A cache write failure must not break hydration/render.

## Test Shape
- Pure codec: round-trip, malformed → null, cross-user → null.
- Disk durability: stub `path_provider` (see `flutter-disk-concurrency-test`), `save` then
  fresh `load` yields the exact pinned set (disk == memory); cross-user `load` → null; clear.
- **Fails-without-fix regression**: drive the real consumer offline (API throws / returns
  null) and assert the slice/state is restored — must fail against the pre-fix empty branch.

# Related
- [[my-loop]]
- [[ses-2026-06-18-review-loop-offline-prs]]
- [[skl-flutter-disk-concurrency-regression-test]]
