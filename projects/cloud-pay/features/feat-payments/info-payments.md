---
type: feature
title: Payment Processing — Info
project: cloud-pay
feature: feat-payments
status: active
role: info
author: robin
tags: [payments, stripe, adyen, pci, transactions]
---

# Current Architecture

### Components
- **Payment Intent Service**: Creates payment intents, validates amounts, applies merchant config
- **Gateway Router**: Routes to Stripe/Adyen/Direct bank based on merchant config + smart routing rules
- **Settlement Engine**: Reconciles gateway callbacks, updates balances, triggers payouts
- **Webhook Processor**: Idempotent handler for gateway events (RabbitMQ consumer)
- **Fraud Shield**: Pre-auth risk scoring using velocity checks + ML model (Azure ML)

### Known Behaviors
- Payment states: `created → authorized → captured → settled` (or `failed`/`refunded` at any point)
- Idempotency key required on all mutation endpoints (24h TTL in Redis)
- Smart routing: Stripe for cards <$500, Adyen for international, direct bank for >$10k
- PCI scope minimized: card data never touches our servers (tokenized at client via Stripe.js/Adyen Drop-in)
- Settlement T+2 for cards, T+1 for bank transfers, T+0 for internal transfers

### Edge Cases
- Partial captures: hotel pre-auth for $500, capture actual $347
- Currency conversion: merchant USD, customer EUR → captured in customer currency, settled in merchant currency
- Timeout handling: if gateway doesn't respond in 30s, mark as "pending_confirmation", reconcile via webhook

## File Map
- `src/CloudPay.Payments/Services/PaymentIntentService.cs` — orchestrates payment lifecycle
- `src/CloudPay.Payments/Routing/GatewayRouter.cs` — smart routing logic
- `src/CloudPay.Payments/Workers/WebhookProcessor.cs` — processes gateway callbacks
- `src/CloudPay.Payments/Models/PaymentState.cs` — state machine definition

## Open Questions
- Should we support cryptocurrency payments in v2?
- Retry policy for failed webhooks: exponential backoff cap at 24h or 48h?
