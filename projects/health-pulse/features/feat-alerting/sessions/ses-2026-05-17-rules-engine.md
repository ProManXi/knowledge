---
type: session
title: Rules Engine & Sustained Alert Logic
date: 2026-05-17
project: health-pulse
feature: feat-alerting
status: complete
author: robin
tags: [rules-engine, sustained-alerts, kafka, state-management]
files:
  - path: services/alerting/rules_engine.py
    role: created
  - path: services/alerting/state_machine.py
    role: created
  - path: services/alerting/models/alert.py
    role: created
---

# What I Did
- Built rules engine: Kafka consumer on `vitals.*` topics, evaluates patient's active rules per observation
- Implemented sustained alert logic: breach counter per (patient, rule) — only fires after N consecutive breaches within duration window
- Created alert state machine: triggered → (auto-resolves if condition clears) OR → acknowledged → resolved
- Added alert deduplication: same (patient, rule, type) can only have one active alert at a time

# Problems I Hit
- Sustained alerts need state across observations — used Redis sorted sets keyed by (patient_id, rule_id)
- If ingestion has a 30s gap, sustained counter resets — decided this is correct (gap = no evidence of continuing breach)

# Decisions Made
- Stateful evaluation in Redis (not in-memory) — survives pod restarts
- Auto-resolve if 3 consecutive observations within normal range after alert triggered

# Next Steps
- Escalation service: time-based notification tiers
- Notification routing to nurses via push and physicians via pager
