---
type: project
name: health-pulse
title: HealthPulse — Patient Monitoring System
status: active
author: robin
tags: [healthtech, iot, monitoring, fhir, hl7, wearables]
---

# HealthPulse

Real-time patient monitoring system. Ingests data from wearables and bedside monitors, applies clinical rules, alerts care teams on anomalies. FHIR-compliant data model. Used in 3 hospitals.

**Stack**: Python (data pipeline) + FastAPI (API) + React (clinical dashboard) + TimescaleDB (time-series) + Apache Kafka (streaming) + HL7 FHIR R4

## Features

```dataview
TABLE status FROM "projects/health-pulse/features" WHERE role = "hub" SORT file.name ASC
```
