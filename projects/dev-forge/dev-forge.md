---
type: project
name: dev-forge
title: DevForge — Internal Developer Platform
status: active
author: robin
tags: [devops, platform-engineering, kubernetes, ci-cd, gitops]
---

# DevForge

Internal developer platform (IDP). Self-service infrastructure provisioning, CI/CD pipelines, environment management, and deployment orchestration. Engineers deploy without DevOps tickets.

**Stack**: Go (control plane) + React (portal) + Kubernetes (runtime) + ArgoCD (GitOps) + Temporal (workflows) + PostgreSQL

## Features

```dataview
TABLE status FROM "projects/dev-forge/features" WHERE role = "hub" SORT file.name ASC
```
