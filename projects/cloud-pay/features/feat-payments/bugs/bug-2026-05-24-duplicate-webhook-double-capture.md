---
type: bug
title: Duplicate Webhook Causing Double Capture
date: 2026-05-24
project: cloud-pay
feature: feat-payments
status: resolved
severity: critical
author: robin
tags: [webhook, idempotency, race-condition]
files:
  - path: src/CloudPay.Payments/Workers/WebhookProcessor.cs
    role: root-cause
  - path: src/CloudPay.Payments/Workers/WebhookProcessor.cs
    role: modified
---

# Description
Stripe occasionally delivers duplicate webhooks within milliseconds. Our processor was checking idempotency key AFTER starting the capture flow — race condition window allowed two captures to execute.

# Root Cause
The idempotency check used a SELECT then INSERT pattern instead of atomic upsert. Two concurrent webhook deliveries could both pass the SELECT before either INSERT completed.

# Fix
Replaced SELECT+INSERT with `INSERT ... ON CONFLICT DO NOTHING` returning whether the row was actually inserted. Only proceeds with capture if the insert succeeded (first writer wins).

# Impact
3 merchants had double-captured payments (~$2,400 total). Refunds issued manually.
