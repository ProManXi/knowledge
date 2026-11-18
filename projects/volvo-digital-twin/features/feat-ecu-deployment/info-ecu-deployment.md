---
type: feature
title: "ECU Deployment — Living Spec"
project: volvo-digital-twin
feature: feat-ecu-deployment
role: info
status: active
author: parth
date: 2026-11-18
tags: [ecu, deployment, truck, hardware]
---

# Current Architecture

### Components
- Handles the actual deployment of packages to truck ECUs
- Digital twin tracks which ECUs are on each truck and their current software versions

### Known Behaviors
- Deployment happens after Session Manager establishes connection
- ECU state is tracked in the digital twin

### Edge Cases
- (To be documented)

## File Map

## Integration Points
- **Session Manager** — manages the connection to the truck
- **Vehicle Service** — reports deployment status back
- **Digital Twin data store** — updates ECU records post-deployment

## Open Questions
- How is the digital twin state stored (database, event store)?
- What ECU types exist and do they have different deployment protocols?
- Rollback mechanism if deployment fails?

## Evolution
- 2026-11-18 — Created. Minimal detail.

# Related
- [[feat-ecu-deployment]]
