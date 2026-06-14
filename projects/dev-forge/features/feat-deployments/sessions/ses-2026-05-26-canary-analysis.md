---
type: session
title: Canary Analysis with Prometheus Metrics
date: 2026-05-26
project: dev-forge
feature: feat-deployments
status: complete
author: robin
tags: [canary, prometheus, analysis, auto-rollback]
files:
  - path: controllers/canary/analyzer.go
    role: created
  - path: controllers/canary/metrics.go
    role: created
  - path: controllers/rollback/engine.go
    role: modified
---

# What I Did
- Built canary analyzer: queries Prometheus for error_rate and p99_latency during canary window
- Defined promotion criteria: error_rate < 1% AND p99 < 2x baseline for 5 consecutive minutes
- Implemented auto-rollback: if criteria fails 3 consecutive checks, triggers ArgoCD revert
- Connected rollback engine to Slack notifications (posts to #deploys channel)

# Problems I Hit
- Prometheus queries need 2min of data before they're meaningful — added initial soak period
- Some services have no baseline metrics (new deployments): skip canary, use rolling update

# Decisions Made
- 5-minute analysis window is sufficient for high-traffic services (>100 RPS)
- Low-traffic services (<10 RPS) skip canary entirely — not enough data points to be statistically meaningful
