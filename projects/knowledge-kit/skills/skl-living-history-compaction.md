---
type: skill
title: "Living History — keep docs current while compacting their evolution"
project: knowledge-kit
features: [feat-pr-review, feat-skill-capture]
category: patterns
status: active
author: robin
date: 2026-06-15
derived-from: "[[ses-2026-06-15-pr-review-capture-feature]]"
repo-path: ""
tags: [documentation, history, compaction, update-session]
---

# Living History — keep docs current while compacting their evolution

## When to Activate
Whenever you update any living vault doc (info files, feature/project hubs, specs, bugs, pr-reviews) —
i.e. in every `update-session` and `packup`. A doc is a living record, not a snapshot.

## The Rule
1. **Read the whole file first.** Understand its current-state sections and its `## Evolution` trail.
2. **Refresh current-state to today** — Architecture, Known Behaviors, Edge Cases, File Map, status,
   newly touched files. Current-state always means *now*.
3. **Append a dated line** to `## Evolution`: `- YYYY-MM-DD — <concise change>`.
4. **Compact as it grows.** Merge same-topic entries; roll older months into one summary line; always
   keep the creation entry and milestone changes. Never delete the fact that something changed —
   summarize it so the change-over-time story survives without bloat.

## Why It Matters
Plain overwrites lose history; append-only logs become unreadable. Compaction keeps both: a reader
sees what is true *now* (current-state sections) and *how it got there* (a compact Evolution trail).

# Related
- [[knowledge-kit]]
- [[ses-2026-06-15-pr-review-capture-feature]]
