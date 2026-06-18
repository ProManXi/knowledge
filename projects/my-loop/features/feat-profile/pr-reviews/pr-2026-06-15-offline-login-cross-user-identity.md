---
type: pr-review
title: "Keep users signed in offline — and not as the wrong person"
project: my-loop
feature: feat-profile
status: merged
kind: bugfix
author: robin
date: 2026-06-15
tracker: github
ref-id: 24
ref-url: "https://github.com/WarPro-Org/my_loop/pull/24"
reviews: "[[bug-2026-06-15-offline-restore-cross-user-identity]]"
files:
  - path: mobile/lib/features/auth/login_screen.dart
    role: modified
  - path: mobile/lib/shared/services/profile_cache.dart
    role: modified
  - path: mobile/lib/shared/services/auth_service.dart
    role: modified
  - path: mobile/lib/features/home/home_screen.dart
    role: modified
  - path: mobile/lib/features/profile/profile_screen.dart
    role: modified
  - path: mobile/lib/shared/services/api_service.dart
    role: modified
  - path: mobile/test/login_persist_test.dart
    role: created
tags: [auth, offline, identity, code-review, anti-cheat]
---

# What This PR Does
Lets a logged-in player open the app and keep using it even when the phone has no
internet — by remembering their last profile on the device. The review made sure
that "remembered" profile can only ever belong to the person actually signed in.

# Why It Was Needed
Before this, if the server was unreachable on launch, an already-authenticated user
was bounced back to the login screen (issue #19). The fix caches the profile so they
stay in. The review caught a sharp edge in that cache: it wasn't tied to *who* it
belonged to.

# How It Works
```mermaid
flowchart LR
  A[App launches, server down] --> B{Firebase has a session?}
  B -- no --> L[Login screen]
  B -- yes --> C{Cached profile's firebaseUid == current user?}
  C -- no --> L
  C -- yes --> H[Restore profile, go Home offline]
```

# Review Findings
| Severity | Finding | Resolved? |
|----------|---------|-----------|
| High | Offline restore checked only `currentUser != null`, not that the cache belonged to the current Firebase user → a second account could inherit the first user's session offline (cache is saved only *after* the server call, so a window exists). | Yes — `1e578ff`: cache bound to `firebaseUid`, restore gated on match |
| Low | `_restoreOfflineSession` returned `true` even when `!mounted` (claimed it navigated when it hadn't). | Yes — returns `false` when not mounted |
| Info | Legacy caches (no `firebaseUid`) — upgrade safety. | Handled — `decode` returns `null`, cache dropped |

# Linked Bug / Feature
Fixes [[bug-2026-06-15-offline-restore-cross-user-identity]] within the
offline-login work for [[feat-profile]]. Merged 2026-06-15.

## Evolution
- 2026-06-15 — PR reviewed; identity-binding bug found, fixed in `1e578ff`, verified, merged.

# Related
- [[feat-profile]]
- [[bug-2026-06-15-offline-restore-cross-user-identity]]
- [[ses-2026-06-15-babysit-and-review-open-prs]]
