---
type: system
title: "Shared Infrastructure"
project: volvo-digital-twin
role: system
status: active
author: parth
date: 2026-11-18
tags: [azure, kubernetes, splunk, jfrog, pipelines]
---

# Shared Infrastructure

Covers the platform-level tools that all services share.

### Architecture

| Tool | What It Does | Parth's Experience Level |
|------|-------------|------------------------|
| **Azure Pipelines** | CI/CD — builds and deploys all services | New — never used before |
| **Kubernetes (K8s)** | Runs the containers; services are deployed as pods | New — never used before |
| **JFrog Artifactory** | Hosts description files, build artifacts, packages | New — never used before |
| **Splunk** | Log aggregation — search logs from all services | New — never used before |
| **Azure Service Bus** | Async messaging between services | New — concept understood, no hands-on |
| **GitHub** | Source code repos (multiple repos, microservices) | Comfortable |

### Known Behaviors
- Deployments go through Azure Pipelines → Kubernetes
- Each microservice is likely its own repo or folder with its own pipeline
- JFrog stores files that Package Builder needs
- Splunk is where you go to debug production issues

### Integration Points
- Every service deploys through Pipelines + K8s
- Every service logs to Splunk
- Service Bus connects most services

## Open Questions
- How are pipelines structured (YAML? classic?)
- K8s namespace layout — one per service? per environment?
- How to access Splunk dashboards and write queries
- JFrog repository structure
- How to run services locally for development

## Evolution
- 2026-11-18 — Created. All tools are new to Parth; documented experience level for each.

# Related
- [[volvo-digital-twin]]
