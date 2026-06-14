---
type: session
title: Real-Time Overlay Engine
date: 2026-05-16
project: shop-stream
feature: feat-streaming
status: complete
author: robin
continues-from: "[[ses-2026-05-15-aws-medialive-pipeline]]"
tags: [websocket, overlays, real-time, flash-sale]
files:
  - path: services/stream-orchestrator/overlay/engine.go
    role: created
  - path: services/stream-orchestrator/overlay/models.go
    role: created
  - path: apps/web/components/Overlay.tsx
    role: created
---

# What I Did
- Built WebSocket overlay engine: seller pins product → event sent to all viewers → product card animates in
- Implemented flash sale timer: server-authoritative countdown synced via NTP offset
- Added viewer count broadcasting (updates every 5s to avoid WebSocket flooding)
- Created React overlay component: renders product cards, timers, and viewer count on top of video player

# Decisions Made
- Server time is authoritative for flash sales — prevents client clock manipulation
- Overlay events are separate WebSocket connection from chat (different scaling needs)
- Product cards pre-fetched on stream join, overlay just references product ID

# Next Steps
- Checkout flow: "buy now" button on overlay → instant purchase without leaving stream
