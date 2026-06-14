---
type: session
title: Kafka Partitioning & TimescaleDB Hypertables
date: 2026-05-12
project: health-pulse
feature: feat-ingestion
status: complete
author: robin
continues-in: "[[ses-2026-05-13-data-quality-monitoring]]"
tags: [kafka, timescaledb, partitioning, performance]
files:
  - path: services/ingestion-worker/kafka_consumer.py
    role: created
  - path: infra/timescaledb/migrations/001_create_hypertables.sql
    role: created
  - path: infra/kafka/topics.yaml
    role: created
---

# What I Did
- Configured Kafka topics partitioned by patient_id (ensures ordering per patient)
- Created TimescaleDB hypertables: `observations_hr`, `observations_spo2`, `observations_bp`, `observations_temp`
- Built batch consumer: pulls from Kafka, buffers 5s, bulk INSERT via COPY command
- Benchmarked: 15k inserts/sec sustained on single TimescaleDB node
- Set up compression policy: compress chunks >7 days old (10x storage reduction)

# Problems I Hit
- COPY command fails on duplicate keys — switched to INSERT ON CONFLICT DO NOTHING
- Kafka consumer group rebalance during deploy drops ~2s of data — added retry with idempotent writes

# Next Steps
- Data quality monitoring: detect gaps, impossible values, sensor drift
