---
type: feature
title: PR Review Capture
project: knowledge-kit
feature: feat-pr-review
status: active
role: hub
author: robin
date: 2026-06-15
tags: [pr-review, code-review, knowledge-capture, update-session]
---

# PR Review Capture

Capture **pull-request reviews** as first-class vault entities, always linked to the bug or feature
they address. Triggered through `update-session` — when the command detects a reviewed PR it runs the
**PR Review Flow** instead of the normal flow. PR reviews are shown in their own dashboard section and
nested under each project/feature, but are kept **out of the Connections graph**.

## How It Works

```mermaid
flowchart TD
  A[update-session] --> B{Reviewed a PR?}
  B -- no --> N[Normal session flow]
  B -- yes --> C{Feature exists?}
  C -- no --> D[Create feature: what it is + how it works]
  C -- yes --> E
  D --> E{Is it a bug fix?}
  E -- yes --> F{Bug documented?}
  F -- no --> G[Create bug: what + why it happened]
  F -- yes --> H
  G --> H[Create pr-review, link PR to bug to feature]
  E -- no --> I[Create pr-review, link PR to feature]
  H --> Z[Rebuild dashboard]
  I --> Z
```

## Sessions

```dataview
TABLE date, author FROM "projects/knowledge-kit/features/feat-pr-review/sessions" SORT date DESC
```

## PR Reviews

```dataview
TABLE date, status, kind, ref-id FROM "projects/knowledge-kit/features/feat-pr-review/pr-reviews" SORT date DESC
```

# Related
- [[knowledge-kit]]
- [[info-pr-review]]
