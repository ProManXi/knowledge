---
type: session
title: "Vault Reconcile — Back-fill master's abb321a Architectural Fixes"
date: 2026-06-14
project: my-loop
feature: feat-territory-capture
status: complete
author: robin
tags: [reconcile, anti-cheat, security, durability, offline-queue, signalr, documentation]
files:
  - path: api/MyLoop.Api/Controllers/MissionsController.cs
    role: analyzed
  - path: api/MyLoop.Api/Controllers/ClaimsController.cs
    role: analyzed
  - path: api/MyLoop.Api/Interfaces/IPathValidationService.cs
    role: analyzed
  - path: api/MyLoop.Api/Services/PathValidationService.cs
    role: analyzed
  - path: api/MyLoop.Api/Services/TerritoryNotifier.cs
    role: analyzed
  - path: api/MyLoop.Api/Services/TerritoryService.cs
    role: analyzed
  - path: api/MyLoop.Api/Services/UserService.cs
    role: analyzed
  - path: api/MyLoop.Api/Constants/AntiCheatConstants.cs
    role: analyzed
  - path: mobile/lib/shared/services/step_claim_queue.dart
    role: analyzed
  - path: mobile/lib/shared/services/batch_drain_service.dart
    role: analyzed
  - path: mobile/lib/shared/services/api_service.dart
    role: analyzed
  - path: mobile/lib/features/journey/journey_controller.dart
    role: analyzed
---

# What I Did

Reconciled the knowledge vault against **master `abb321a`** ("close remaining open
architectural issues — security, anti-cheat, durability", 2026-06-11), which shipped 9 fixes
that were never recorded in the vault (last vault update was 2026-06-02).

Source of truth: read the actual master source for every changed symbol before writing, rather
than trusting the commit message alone.

## Changes Back-filled (by issue → feature)

| Issue (abb321a) | What shipped | Vault file updated |
|---|---|---|
| CRITICAL-2 (BOLA) | Missions/XP endpoints now `[Authorize]` + `DenySelf(routeUserId)` via `ICurrentUser` (401/403) | info-progression, spec security |
| CRITICAL-3 (privacy) | `UserService.DeleteUserData` purges all 8 child tables (was 4); no DB FK cascades exist | info-profile, spec security |
| CRITICAL-7 / HIGH-13 | `PathValidationService.ValidateConsecutivePoints` — anti-cheat on the batch-step path (per-hop speed bound + 30m drift) | info-territory-capture, spec §3 |
| HIGH-10 | Resilient SignalR: per-region try/catch + non-throwing `SafeSendToUser<T>` | info-live-map, info-territory-capture |
| HIGH-11 | Real walked distance on batch path via `IGeoService.CalculatePathDistance` → DistanceKm + WalkDistance mission | info-progression, info-territory-capture |
| CRITICAL-8 | Crash-safe WAL: `StepClaimQueue._atomicWrite` (tmp + flush + rename) | info-territory-capture, spec |
| MEDIUM-5 | Permanent vs transient batch failures: `BatchRejectedException` (4xx) vs null (5xx) + `onRejection` stream | info-territory-capture |

Also fixed a stale File Map entry in info-profile (referenced non-existent
`Endpoints/UserEndpoints.cs` → actually `Controllers/UsersController.cs` + `Services/UserService.cs`).

# Decisions Made

- **Scope = master, not the current branch.** The working branch `ashukla/fix-stepqueue-writelock`
  (`31be838`, WAL write-lock) is divergent and NOT in master, so its write-lock was deliberately
  NOT documented in the info files. Documented master's atomic-write durability only.
- **Info files left dateless** (living docs, by vault convention) — this dated session is the
  dashboard-visible artifact for the reconciliation.
- Captured abb321a's intentionally-deferred items in spec "Needs Work" rather than as fixes.

# Next Steps

- When `ashukla/fix-stepqueue-writelock` merges to master → add the WAL write-lock line to the
  info-territory-capture durability section.
- Deferred audit items still open: web 53-bit cellId overflow (CRITICAL-9), HexCount
  reconciliation, mission timezone, AchievementsController self-only audit.

# Related
- [[feat-territory-capture]]
- [[feat-progression]]
- [[feat-profile]]
- [[feat-live-map]]
</content>
</invoke>
