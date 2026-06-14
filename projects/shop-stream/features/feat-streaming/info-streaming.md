---
type: feature
title: Live Streaming — Info
project: shop-stream
feature: feat-streaming
status: active
role: info
author: robin
tags: [video, live, rtmp, hls, aws-medialive]
---

# Current Architecture

### Components
- **Ingest Service**: Accepts RTMP from seller's OBS/mobile app, forwards to AWS MediaLive
- **Transcoding Pipeline**: AWS MediaLive → 3 quality tiers (1080p, 720p, 480p) → HLS output
- **CDN Distribution**: CloudFront with 12 edge locations, <3s glass-to-glass latency
- **Stream Orchestrator (Go)**: Manages stream lifecycle, emits events (started/ended/product-pinned)
- **Overlay Engine**: WebSocket-pushed overlays (product cards, flash sale timers, viewer count)

### Known Behaviors
- RTMP ingest → MediaLive transcode → HLS segments (2s chunks) → CloudFront → viewer
- Latency: 2-4s for HLS, sub-1s for WebRTC preview (seller monitoring only)
- Stream recording: all streams auto-saved to S3 for VOD replay
- Concurrent viewers: tested to 50k per stream without degradation
- Auto-quality: player switches tiers based on viewer bandwidth (ABR)

### Edge Cases
- Seller disconnects mid-stream: 30s reconnect window before stream marked "ended"
- Flash sale starts while viewer is buffering: countdown synced to server time, not stream time
- Mobile backgrounding: iOS kills RTMP after 3min background — foreground notification required

## File Map
- `services/stream-orchestrator/main.go` — stream lifecycle management
- `services/stream-orchestrator/overlay/engine.go` — real-time overlay push
- `infra/terraform/medialive.tf` — AWS MediaLive channel config
- `apps/web/components/Player.tsx` — HLS player with ABR + overlay rendering

## Open Questions
- Should we support multi-host streams (two sellers co-streaming)?
- WebRTC for ultra-low-latency viewers willing to pay premium?
