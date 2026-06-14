---
type: session
title: Kubernetes Operator for Environment CRD
date: 2026-05-18
project: dev-forge
feature: feat-environments
status: complete
author: robin
continues-in: "[[ses-2026-05-19-database-provisioner]]"
tags: [kubernetes, operator, crd, controller-runtime]
files:
  - path: controllers/environment_controller.go
    role: created
  - path: manifests/crd/environment.yaml
    role: created
  - path: controllers/provisioners/namespace.go
    role: created
---

# What I Did
- Scaffolded operator with kubebuilder (Go, controller-runtime v0.17)
- Defined EnvironmentRequest CRD: spec includes tier, TTL, services list, database seed flag
- Implemented reconcile loop: CRD created → namespace + ResourceQuota + NetworkPolicy + ServiceAccount
- Added status conditions: Provisioning → Ready → Expiring → Destroyed
- Tested: `kubectl apply -f env.yaml` → namespace appears in ~8s

# Decisions Made
- Used kubebuilder over Operator SDK: lighter weight, better docs, native controller-runtime
- CRD-based over REST API: GitOps-friendly, can manage environments via ArgoCD

# Next Steps
- Database provisioner: create PostgreSQL DB per environment
