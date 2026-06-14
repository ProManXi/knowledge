---
type: project
name: cloud-pay
title: CloudPay — Payment Processing Platform
status: active
author: robin
tags: [fintech, payments, stripe, compliance, pci]
---

# CloudPay

Multi-tenant payment processing platform. Handles card payments, bank transfers, refunds, and subscription billing. PCI-DSS Level 1 compliant. Integrates with Stripe, Adyen, and direct bank APIs.

**Stack**: .NET 8 (API) + React (merchant dashboard) + PostgreSQL + Redis + RabbitMQ + Azure (infra)

## Features

```dataview
TABLE status FROM "projects/cloud-pay/features" WHERE role = "hub" SORT file.name ASC
```
