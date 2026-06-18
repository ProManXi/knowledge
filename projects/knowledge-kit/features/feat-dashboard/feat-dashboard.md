---
type: feature
title: Dashboard
project: knowledge-kit
feature: feat-dashboard
status: active
role: hub
author: robin
date: 2026-06-14
tags: [dashboard, ui]
---

# Dashboard

## Key Behaviors
Static HTML/JS/CSS dashboard served locally. Reads a single `data.json` built by `build_data.py`.
All views are in-memory; no backend. Adding a new tab requires: nav item in HTML, view section in HTML,
a JS renderer in `views/`, registration in `app.js`, and a title in `navigation.js`.

# Related
- [[knowledge-kit]]
