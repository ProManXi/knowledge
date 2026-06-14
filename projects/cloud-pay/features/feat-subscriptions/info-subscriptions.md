---
type: feature
title: Subscription Billing — Info
project: cloud-pay
feature: feat-subscriptions
status: active
role: info
author: robin
tags: [subscriptions, recurring, billing, dunning]
---

# Current Architecture

### Components
- **Plan Registry**: Defines billing plans (monthly/annual, tiered pricing, usage-based)
- **Subscription Manager**: Lifecycle management — create, upgrade, downgrade, cancel, pause
- **Billing Clock**: Cron-triggered, generates invoices at period boundaries
- **Dunning Engine**: Retries failed payments (day 1, 3, 7, 14 — then cancels)
- **Proration Calculator**: Computes credits/charges on mid-cycle plan changes

### Known Behaviors
- Invoice generated 3 days before billing date (allows customer to update payment method)
- Proration: upgrade charges immediately, downgrade credits at next period
- Trial-to-paid: first invoice generated on trial end date
- Grace period: 14 days of dunning before hard cancellation
- Pause: freezes billing but retains subscription (max 90 days)

### Edge Cases
- Customer upgrades mid-trial: trial ends immediately, starts paid subscription
- Annual-to-monthly downgrade: refund remaining annual amount minus discount
- Payment method expires mid-subscription: triggers pre-dunning notification 30 days before expiry

## File Map
- `src/CloudPay.Subscriptions/Services/SubscriptionManager.cs` — lifecycle orchestrator
- `src/CloudPay.Subscriptions/Billing/BillingClock.cs` — generates invoices on schedule
- `src/CloudPay.Subscriptions/Dunning/DunningEngine.cs` — retry failed payments
- `src/CloudPay.Subscriptions/Proration/ProrationCalculator.cs` — mid-cycle change math

## Open Questions
- Should paused subscriptions count toward MRR reporting?
- Usage-based billing: aggregate at end of period or charge in real-time at threshold?
