---
type: incident
title: Alert Storm — 500+ False Alerts in 10 Minutes
date: 2026-05-26
project: health-pulse
feature: feat-alerting
status: resolved
severity: critical
author: robin
tags: [alert-storm, false-positive, sensor-batch, incident]
files:
  - path: services/alerting/rules_engine.py
    role: root-cause
  - path: services/alerting/rules_engine.py
    role: modified
  - path: services/ingestion-worker/quality_monitor.py
    role: analyzed
---

# Description
After a network partition resolved at Hospital B, 30 devices reconnected simultaneously and dumped 10+ minutes of buffered data. The rules engine processed these as real-time observations, triggering 500+ alerts in rapid succession. Nurses overwhelmed, alert system lost credibility.

# Timeline
- 09:12 — Network partition at Hospital B (switches rebooting)
- 09:22 — Network restored, 30 devices reconnect
- 09:22-09:25 — Ingestion receives burst of 10min buffered data from all devices
- 09:23 — Rules engine fires 500+ alerts (interpreting buffered data as live breaches)
- 09:25 — On-call engineer manually disables alerting for Hospital B
- 09:40 — Root cause identified, fix deployed
- 09:45 — Alerting re-enabled

# Root Cause
Rules engine did not compare observation timestamps against current time. Buffered observations from 10 minutes ago were evaluated as if they were happening NOW. Sustained alert logic was fooled because it saw consecutive breaches (which actually happened minutes apart in real time).

# Fix
- Added staleness check: observations with timestamps >60s in the past are flagged `stale` and excluded from alert evaluation
- Stale observations still stored in TimescaleDB but do not trigger alerts
- Added rate limiter: max 10 alerts per patient per 5-minute window (excess queued, not dropped)

# Prevention
- Ingestion pipeline now adds `received_at` timestamp alongside device `observed_at`
- Alert evaluation uses `received_at` for freshness check, `observed_at` for clinical context
- Added monitoring: alert if ingestion lag (received_at - observed_at) exceeds 30s for >10 devices
