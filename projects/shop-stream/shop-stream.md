---
type: project
name: shop-stream
title: ShopStream — Live Shopping Platform
status: active
author: robin
tags: [e-commerce, live-streaming, marketplace, social-commerce]
---

# ShopStream

Live shopping platform where sellers broadcast product demos and viewers buy in real-time. TikTok Shop meets Twitch. Handles live video, real-time chat, flash sales with countdown timers, and instant checkout.

**Stack**: Next.js 14 (web) + React Native (mobile) + Go (real-time services) + PostgreSQL + Redis + AWS MediaLive (streaming) + CloudFront (CDN)

## Features

```dataview
TABLE status FROM "projects/shop-stream/features" WHERE role = "hub" SORT file.name ASC
```
