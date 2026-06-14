---
type: session
title: Database Provisioner & Seed Strategy
date: 2026-05-19
project: dev-forge
feature: feat-environments
status: complete
author: robin
continues-from: "[[ses-2026-05-18-k8s-operator-environment-crd]]"
tags: [database, postgresql, provisioning, seed]
files:
  - path: controllers/provisioners/database.go
    role: created
  - path: controllers/provisioners/seed.go
    role: created
  - path: scripts/pg-seed-template.sql
    role: created
---

# What I Did
- Built database provisioner: creates PostgreSQL database on shared cluster, applies schema migrations
- Implemented seed strategy: pg_dump of staging schema (no data) + fixture data from seed template
- Added connection string injection: writes DB credentials to K8s Secret in env namespace
- Measured: full DB provision + seed takes ~2.5min (schema only: 30s)

# Problems I Hit
- pg_dump includes ownership that references staging role — had to strip OWNER statements
- Large staging schemas (500+ tables) take 40s just for structure — acceptable for now

# Decisions Made
- Shared PostgreSQL cluster (not dedicated instance per env) — cost is 10x lower
- Fixture data is hand-curated, not anonymized production data (GDPR simpler)

# Next Steps
- DNS provisioner: auto-create wildcard DNS for each environment
- CLI: `forge env create --name my-feature --tier dev --ttl 72h`
