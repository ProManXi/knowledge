---
type: feature
title: Vital Signs Ingestion — Info
project: health-pulse
feature: feat-ingestion
status: active
role: info
author: robin
tags: [vitals, iot, kafka, time-series, wearables]
---

# Current Architecture

### Components
- **Device Gateway (Python)**: MQTT broker that accepts data from hospital network bridges and BLE-to-WiFi hubs
- **Schema Validator**: Validates incoming payloads against FHIR Observation resource schema
- **Kafka Producer**: Publishes validated observations to `vitals.{type}` topics (partitioned by patient ID)
- **TimescaleDB Writer**: Kafka consumer that batch-inserts into hypertables (5s flush interval)
- **Data Quality Monitor**: Flags gaps >30s, impossible values (HR >300, SpO2 >100%), sensor drift

### Known Behaviors
- Ingestion rate: ~12,000 observations/second across 3 hospitals (800 active patients)
- Latency: device → Kafka < 200ms, Kafka → TimescaleDB < 5s
- Retention: raw data 90 days, 1-minute aggregates forever
- Device reconnect: if device goes offline >30s, system marks patient as "signal lost"
- Deduplication: based on (patient_id, device_id, timestamp) composite key — idempotent writes

### Edge Cases
- Device clock drift: some monitors have clocks off by minutes — server timestamps used as fallback
- Burst after disconnect: device reconnects and dumps 10min of buffered data — writer handles out-of-order
- Multiple devices per patient: bedside monitor + wearable — must correlate, not duplicate

## File Map
- `services/device-gateway/mqtt_handler.py` — MQTT message processing
- `services/device-gateway/fhir_validator.py` — FHIR Observation schema validation
- `services/ingestion-worker/kafka_consumer.py` — batch writer to TimescaleDB
- `services/ingestion-worker/quality_monitor.py` — data quality checks
- `infra/kafka/topics.yaml` — topic configuration

## Open Questions
- Should we support direct BLE ingestion from patient's personal phone?
- ECG waveform data: store raw waveform (4kHz) or only derived metrics?
