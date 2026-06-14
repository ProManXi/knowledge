---
type: incident
title: Stream CDN Cache Poisoning — Wrong Stream Served
date: 2026-05-22
project: shop-stream
feature: feat-streaming
status: resolved
severity: high
author: robin
tags: [cdn, cloudfront, cache, security]
files:
  - path: infra/terraform/cloudfront.tf
    role: root-cause
  - path: infra/terraform/cloudfront.tf
    role: modified
---

# Description
Viewers of Stream A briefly saw segments from Stream B. Duration: ~45 seconds. Affected ~200 viewers.

# Timeline
- 14:32 — Seller reports "my viewers are seeing someone else's stream"
- 14:35 — Confirmed via CloudFront access logs: cache key collision between two streams
- 14:38 — Invalidated CloudFront cache for affected paths
- 14:40 — All viewers back on correct streams

# Root Cause
CloudFront cache key only included path (`/streams/{id}/segment.ts`) but not the query string containing the signed token. Two streams with sequential IDs had overlapping segment numbers, and a cache edge served the wrong cached segment.

# Fix
Added `stream_id` and `token_hash` to CloudFront cache key policy. Each stream now has a completely unique cache namespace regardless of path similarity.

# Prevention
- Cache key policy now includes Origin header + custom `X-Stream-ID` header
- Added integration test: two concurrent streams must never cross-contaminate at cache level
