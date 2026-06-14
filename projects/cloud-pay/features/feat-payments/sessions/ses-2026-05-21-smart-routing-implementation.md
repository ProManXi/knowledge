---
type: session
title: Smart Routing Implementation
date: 2026-05-21
project: cloud-pay
feature: feat-payments
status: complete
author: robin
continues-from: "[[ses-2026-05-20-payment-gateway-integration]]"
continues-in: "[[ses-2026-05-23-settlement-engine]]"
tags: [routing, optimization, fallback]
files:
  - path: src/CloudPay.Payments/Routing/GatewayRouter.cs
    role: created
  - path: src/CloudPay.Payments/Routing/RoutingRules.cs
    role: created
  - path: tests/CloudPay.Payments.Tests/RoutingTests.cs
    role: created
---

# What I Did
- Built GatewayRouter with rule-based routing: amount thresholds, currency, merchant preference
- Implemented fallback: if primary gateway returns 5xx, retry on secondary within same request
- Added circuit breaker (Polly) per gateway — opens after 5 consecutive failures in 60s window
- Created routing rules config: editable per merchant via admin dashboard

# Problems I Hit
- Adyen returns different error codes for "insufficient funds" vs "do not honor" — normalized to common decline codes
- Circuit breaker needs to be per-gateway PER-region (EU Stripe vs US Stripe are separate)

# Next Steps
- Settlement engine: reconcile authorized → captured → settled
