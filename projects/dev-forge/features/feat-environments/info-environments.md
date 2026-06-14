---
type: feature
title: Environment Provisioning — Info
project: dev-forge
feature: feat-environments
status: active
role: info
author: robin
tags: [environments, kubernetes, namespaces, self-service]
---

# Current Architecture

### Components
- **Environment Controller (Go)**: Kubernetes operator — watches EnvironmentRequest CRDs, provisions namespaces
- **Resource Quotas**: Each env gets CPU/memory limits based on tier (dev: 2 CPU/4Gi, staging: 8 CPU/16Gi)
- **Database Provisioner**: Creates isolated PostgreSQL database per environment (pg_dump seed from staging)
- **DNS Manager**: Creates `{env-name}.dev.internal` wildcard DNS via ExternalDNS
- **TTL Reaper**: Cron job destroys environments past their expiry (default: 72h for preview, infinite for staging)

### Known Behaviors
- Provisioning time: ~45s for namespace + quotas, ~3min with database seed
- Preview environments auto-created on PR open, destroyed on PR merge/close
- Staging environments are persistent, require manual destruction or quota review
- Resource isolation: NetworkPolicy restricts cross-namespace traffic by default
- Secrets: cloned from a template namespace, sensitive values masked with env-specific prefix

### Edge Cases
- Developer creates env while cluster is at 90% capacity: queued, provisioned when resources free
- PR reopened after env destroyed: new env created, fresh database (no state carry-over)
- TTL extension: developer can extend up to 7 days via CLI, then requires team lead approval

## File Map
- `controllers/environment_controller.go` — K8s operator reconcile loop
- `controllers/provisioners/database.go` — PostgreSQL provisioning
- `controllers/provisioners/dns.go` — ExternalDNS record creation
- `cmd/forge-cli/env.go` — CLI commands for env management
- `manifests/crd/environment.yaml` — EnvironmentRequest CRD schema

## Open Questions
- Should preview environments share a database instance (cheaper) or always get dedicated (safer)?
- GPU environments for ML teams: separate node pool or shared with resource quotas?
