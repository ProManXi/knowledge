---
type: feature
title: Instant Checkout — Info
project: shop-stream
feature: feat-checkout
status: active
role: info
author: robin
tags: [checkout, cart, payments, conversion]
---

# Current Architecture

### Components
- **Quick Buy API**: Single POST endpoint — product ID + saved payment method → order created in <500ms
- **Payment Adapter**: Talks to Stripe (pre-authorized payment methods stored via SetupIntents)
- **Inventory Lock**: Redis-based 60s hold on item during checkout (prevents oversell on flash sales)
- **Order Service**: Creates order, triggers fulfillment webhook to seller

### Known Behaviors
- One-tap flow: viewer taps "Buy" → pre-saved card charged → order confirmed in <2s
- Flash sale stock: Redis DECR atomic — first N buyers get the deal, rest see "sold out"
- No cart needed for live purchases — single item, instant decision
- Guest checkout NOT supported (must have account with saved payment method)

### Edge Cases
- Flash sale: 1000 viewers tap "Buy" simultaneously — Redis DECR ensures exactly N orders, others get 402
- Payment decline during flash sale: inventory lock released after 60s timeout, item returns to pool
- Seller ends stream mid-flash-sale: pending inventory locks still honored until timeout

## File Map
- `services/checkout-api/handlers/quick_buy.go` — instant purchase endpoint
- `services/checkout-api/inventory/lock.go` — Redis inventory hold
- `services/checkout-api/payments/stripe_adapter.go` — charges pre-saved payment methods
- `apps/web/components/BuyButton.tsx` — one-tap purchase UI
