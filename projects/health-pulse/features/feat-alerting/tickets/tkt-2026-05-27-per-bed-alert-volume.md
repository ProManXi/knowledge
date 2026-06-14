---
type: ticket
title: Nurse Station Wants Per-Bed Alert Volume Control
date: 2026-05-27
project: health-pulse
feature: feat-alerting
status: open
severity: medium
author: robin
tags: [ux, nurse-station, alert-fatigue, volume]
---

# Description
Ward 3B nursing lead requests the ability to set alert notification volume differently per bed. ICU beds should be louder than general ward beds. Currently all alerts play at the same volume on the ward dashboard.

# Requirements
- Per-bed volume level (0-100%) configurable from the clinical dashboard
- Separate volume for critical vs non-critical alerts
- Night mode should reduce non-critical volume further (not just suppress)

# Acceptance Criteria
- [ ] Volume slider per bed on ward configuration page
- [ ] Critical alerts always play at minimum 50% regardless of setting
- [ ] Night mode applies additional -30% reduction to non-critical
- [ ] Settings persist across browser refresh (stored server-side per ward config)
