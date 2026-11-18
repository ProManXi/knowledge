---
type: feature
title: "Session Manager — Living Spec"
project: volvo-digital-twin
feature: feat-session-manager
role: info
status: active
author: parth
date: 2026-11-18
tags: [session, deployment, truck]
---

# Current Architecture

### Components
- **Session Manager** — creates and manages deployment sessions with physical trucks
- Handles the last-mile connection to the truck's ECUs
- Deploys packages built by Package Builder

### Known Behaviors
- Triggered by Vehicle Service after package is ready
- Manages session lifecycle (create → deploy → complete/fail)

### Edge Cases
- (To be documented)

## File Map

## Integration Points
- **Vehicle Service** — receives session creation requests
- **Package Builder** — receives built packages
- **Physical Truck** — proprietary communication protocol

## Open Questions
- How does the truck connection work (protocol, auth)?
- Session timeout and retry behavior?
- What happens if the truck goes offline mid-deployment?

## Evolution
- 2026-11-18 — Created. High-level only.

# Related
- [[feat-session-manager]]
