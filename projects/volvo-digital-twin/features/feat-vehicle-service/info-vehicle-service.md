---
type: feature
title: "Vehicle Service API — Living Spec"
project: volvo-digital-twin
feature: feat-vehicle-service
role: info
status: active
author: parth
date: 2026-11-18
tags: [orchestration, api]
---

# Current Architecture

### Components
- **Vehicle Service API** — the central orchestrator for the digital twin platform
- Receives BOM (Bill of Materials) files from external systems
- Routes work to Package Builder and Session Manager
- Publishes/subscribes to events on Azure Service Bus and message queues
- Coordinates with 10-20 downstream integration services

### Known Behaviors
- Acts as the entry point for all truck software update requests
- Orchestrates the full flow: BOM → build → session → deploy

### Edge Cases
- (To be documented as discovered during work)

## File Map
<!-- Key source files — updated as work happens -->

## Integration Points
- **Package Builder** — HTTP and/or Service Bus to trigger package builds
- **Session Manager** — HTTP and/or Service Bus to create deployment sessions
- **Integration Services (10-20)** — event-driven via Service Bus / message queues
- **JFrog** — indirect (through Package Builder for description files)
- **Splunk** — logs

## Open Questions
- Full list of API endpoints
- Which integration services does it talk to and what events does it publish?
- How does it handle partial failures in the orchestration chain?
- What is the BOM validation logic?

## Evolution
- 2026-11-18 — Created. High-level architecture from onboarding; no code-level detail yet.

# Related
- [[feat-vehicle-service]]
