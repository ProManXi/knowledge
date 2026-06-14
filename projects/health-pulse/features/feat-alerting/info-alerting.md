---
type: feature
title: Clinical Alerting — Info
project: health-pulse
feature: feat-alerting
status: active
role: info
author: robin
tags: [alerts, clinical-rules, notifications, escalation]
---

# Current Architecture

### Components
- **Rules Engine (Python)**: Evaluates clinical rules against incoming vital observations (Kafka consumer)
- **Alert State Machine**: Manages alert lifecycle: triggered → acknowledged → resolved (or escalated)
- **Escalation Service**: Time-based escalation: badge (0min) → push (5min) → pager (15min)
- **Notification Router**: Sends to correct channel based on escalation level and on-call schedule
- **Rule Builder UI**: React form where clinicians create/edit rules without code

### Known Behaviors
- Rule evaluation: every observation checked against all active rules for that patient (typically 5-15 rules per patient)
- Sustained alerts: threshold must be breached for configured duration (default 5min) before triggering
- Alert fatigue mitigation: same alert type suppressed for 30min after acknowledgment
- Escalation: if not acknowledged within 5min → push to assigned nurse; 15min → pager to on-call physician
- Night mode: non-critical alerts suppressed 22:00-06:00 (configurable per ward)

### Edge Cases
- Rule conflict: "alert if HR > 100" AND "alert if HR > 150" — both trigger, higher severity wins for notification
- Patient transferred between wards: rules follow the patient, escalation chain updates to new ward staff
- Sensor disconnected: "signal lost" alert has its own escalation path (may indicate patient emergency)

## File Map
- `services/alerting/rules_engine.py` — evaluates rules against observations
- `services/alerting/state_machine.py` — alert lifecycle management
- `services/alerting/escalation.py` — time-based notification escalation
- `apps/clinical-dashboard/components/AlertBuilder.tsx` — rule creation UI
- `services/alerting/notification_router.py` — channel routing

## Open Questions
- Should ML-based anomaly detection supplement rule-based alerts?
- Can we integrate with hospital pager systems (POCSAG) or only modern push/SMS?
