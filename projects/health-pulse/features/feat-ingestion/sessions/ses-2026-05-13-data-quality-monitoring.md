---
type: session
title: Data Quality Monitoring & Anomaly Flags
date: 2026-05-13
project: health-pulse
feature: feat-ingestion
status: complete
author: robin
continues-from: "[[ses-2026-05-12-kafka-timescaledb-setup]]"
tags: [quality, monitoring, anomaly, validation]
files:
  - path: services/ingestion-worker/quality_monitor.py
    role: created
  - path: services/ingestion-worker/rules/vital_ranges.py
    role: created
---

# What I Did
- Built data quality monitor: runs alongside ingestion, checks each observation
- Defined physiological ranges: HR 30-220, SpO2 70-100%, Temp 30-42°C, RR 4-60
- Implemented gap detection: if no data for patient >30s, emit "signal_lost" event
- Added drift detection: if values change by <0.01% over 10min, likely frozen sensor
- Quality metrics published to Prometheus: gap_count, invalid_count, drift_count per device

# Decisions Made
- Out-of-range values are flagged but still stored (clinicians may want to see them)
- Signal loss events go to the alerting pipeline (separate feature)

# Next Steps
- Alerting rules engine: clinical rules that trigger nurse notifications
