---
type: feature
title: Skill Capture
project: knowledge-kit
feature: feat-skill-capture
status: active
role: hub
author: robin
date: 2026-06-14
tags: [skills, knowledge-capture, update-session]
---

# Skill Capture

## Key Behaviors
Automatic extraction of reusable operational knowledge (patterns, gotchas, architectural rules)
during `update-session`. Skills live in `projects/{slug}/skills/` in the vault as `skl-{name}.md`
entities. If `update-session` is run from the code repo root, a SKILL.md copy is also written to
`.claude/skills/{category}/` for Claude to use while coding.

# Related
- [[knowledge-kit]]
