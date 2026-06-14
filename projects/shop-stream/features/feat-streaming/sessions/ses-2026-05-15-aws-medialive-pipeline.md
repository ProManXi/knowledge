---
type: session
title: AWS MediaLive Pipeline Setup
date: 2026-05-15
project: shop-stream
feature: feat-streaming
status: complete
author: robin
continues-in: "[[ses-2026-05-16-overlay-engine]]"
tags: [aws, medialive, terraform, infrastructure]
files:
  - path: infra/terraform/medialive.tf
    role: created
  - path: infra/terraform/cloudfront.tf
    role: modified
  - path: services/stream-orchestrator/ingest/rtmp_handler.go
    role: created
---

# What I Did
- Provisioned AWS MediaLive channel with Terraform (RTMP input, HLS output, 3 quality tiers)
- Configured CloudFront distribution with signed URLs (stream access requires valid session token)
- Built RTMP handler in Go: validates seller auth token, creates MediaLive input, starts channel
- Tested end-to-end: OBS → MediaLive → CloudFront → HLS.js player — 2.8s latency

# Problems I Hit
- MediaLive channel start takes 15-20s — need to pre-warm channels for sellers with scheduled streams
- CloudFront signed URLs expire: if stream runs >4h, viewer needs token refresh

# Next Steps
- Build overlay engine (WebSocket-based product cards during stream)
