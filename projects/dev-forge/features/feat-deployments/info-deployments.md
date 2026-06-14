---
type: feature
title: Deployment Orchestration — Info
project: dev-forge
feature: feat-deployments
status: active
role: info
author: robin
tags: [deployments, gitops, argocd, canary, rollback]
---

# Current Architecture

### Components
- **Deploy Controller**: Watches DeploymentRequest CRDs, translates to ArgoCD Application manifests
- **Canary Analyzer**: Runs Prometheus queries during canary rollout, auto-promotes or rolls back
- **Rollback Engine**: Reverts ArgoCD Application to previous Git SHA on failure detection
- **Deploy Dashboard**: SSE-powered real-time view of all active rollouts across clusters

### Known Behaviors
- Deploy flow: PR merged → Git tag → ArgoCD syncs → canary 10% → analyze 5min → promote to 100%
- Rollback trigger: error rate >1% or p99 latency >2x baseline during canary window
- Blue-green: only for stateful services (databases, queues) — switches DNS, not pods
- Deploy lock: only one deployment per service at a time (queues concurrent requests)

### Edge Cases
- Deploy during incident: deploy lock can be force-overridden by on-call engineer
- Canary with zero traffic: services with <10 RPS skip canary, go straight to rolling update
- Multi-cluster: canary runs in primary cluster first, then promotes to secondary clusters sequentially

## File Map
- `controllers/deploy_controller.go` — translates DeploymentRequest to ArgoCD manifests
- `controllers/canary/analyzer.go` — Prometheus-based canary health analysis
- `controllers/rollback/engine.go` — automated rollback on failure
- `apps/portal/pages/deployments.tsx` — real-time deploy dashboard
