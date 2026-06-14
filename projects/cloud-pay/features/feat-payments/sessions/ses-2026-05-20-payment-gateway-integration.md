---
type: session
title: Payment Gateway Integration — Stripe & Adyen
date: 2026-05-20
project: cloud-pay
feature: feat-payments
status: complete
author: robin
continues-in: "[[ses-2026-05-21-smart-routing-implementation]]"
tags: [gateway, stripe, adyen, integration]
files:
  - path: src/CloudPay.Payments/Gateways/StripeGateway.cs
    role: created
  - path: src/CloudPay.Payments/Gateways/AdyenGateway.cs
    role: created
  - path: src/CloudPay.Payments/Gateways/IGateway.cs
    role: created
---

# What I Did
- Implemented Stripe gateway adapter (PaymentIntents API v2023-10-16)
- Implemented Adyen gateway adapter (Checkout API v71)
- Defined IGateway interface: Authorize, Capture, Refund, Cancel
- Set up webhook signature verification for both
- Added idempotency key forwarding to both gateways

# Decisions Made
- Use gateway-native idempotency (Stripe-Idempotency-Key header, Adyen reference field)
- Webhook verification at middleware level, not per-handler

# Next Steps
- Implement smart routing based on merchant config
- Add fallback logic (if primary gateway fails, try secondary)
