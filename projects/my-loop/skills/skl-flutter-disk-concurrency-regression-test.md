---
type: skill
title: "Prove a Flutter disk/concurrency regression test by reverting the fix"
project: my-loop
features: [feat-territory-capture]
category: testing
status: active
author: robin
date: 2026-06-15
derived-from: "[[ses-2026-06-15-babysit-and-review-open-prs]]"
repo-path: ".claude/skills/flutter-disk-concurrency-test/SKILL.md"
tags: [testing, concurrency, path-provider, regression, wal, dart]
---

# Prove a Flutter disk/concurrency regression test by reverting the fix

## When to Activate
Writing a regression test for a Flutter service that persists to disk
(write-ahead log, cache) and/or serializes async operations — especially when the
service uses `path_provider`.

## Pattern
- **Stub `path_provider` with the platform interface, not a method-channel mock.**
  Subclass `PathProviderPlatform with MockPlatformInterfaceMixin`, override
  `getApplicationDocumentsPath` to return a `Directory.systemTemp.createTemp(...)`
  path, and assign it to `PathProviderPlatform.instance` in `setUp`; delete the temp
  dir in `tearDown`. Add `path_provider_platform_interface` + `plugin_platform_interface`
  to `dev_dependencies` so the imports don't trip `depend_on_referenced_packages`.
- **Test the durability invariant, not just memory.** After an awaited batch of
  operations, reopen a fresh instance that reads only from disk and assert it equals
  the live in-memory view — AND assert the exact expected surviving set. (disk==memory
  alone can pass on a regression that drops *everything*, leaving both empty.)
- **Force the race deterministically.** Fire the conflicting ops without awaiting
  between them (`Future.wait([rewrite, append, append])`) and loop ~25 iterations.
- **Prove the test catches the bug.** Temporarily restore the pre-fix source
  (`git show <fix>^:path > file`), run the test, confirm it FAILS, then restore the
  fixed version. A regression test that never fails without the fix guards nothing.

# Related
- [[my-loop]]
- [[ses-2026-06-15-babysit-and-review-open-prs]]
- [[feat-territory-capture]]
