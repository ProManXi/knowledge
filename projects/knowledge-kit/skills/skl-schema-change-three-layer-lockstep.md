---
type: skill
title: "Change the entity schema in lockstep across guide → builder → views"
project: knowledge-kit
features: [feat-dashboard]
category: architecture
status: active
author: robin
date: 2026-06-18
derived-from: "[[ses-2026-06-18-work-item-ids-and-generic-kit]]"
repo-path: ""
tags: [schema, dashboard, build-data, contract, gotcha]
---

# Change the entity schema in lockstep across guide → builder → views

## When to Activate
Whenever you add, rename, or remove a YAML field that the dashboard reads, or change how an entity is
labelled/displayed (IDs, badges, stats). This is the cross-stack contract behind the dashboard.

## The Rule — touch all three layers, then rebuild
1. **Schema — `_guide.md`**: change the field definition and every template that carries it.
2. **Builder — `dashboard/build_data.py`**: change what gets parsed and what is *attached to each
   entity/timeline item/graph node*. Prefer computing display values **here** (e.g. `work_item_label`
   → `workItem`) so the static UI just renders a string and you don't edit N call sites per change.
3. **Views — `dashboard/js/**`**: update `utils.js` helpers and every renderer that reads the field.
   Grep for the old key across all of `js/` — the same field is usually read in ~10+ places.
4. **Rebuild + verify**: run `python3 dashboard/build_data.py`; assert the old key is gone from
   `data.json` and the new one is present on entities/timeline/nodes; grep the repo for stragglers.

## Why It Matters
A field read in the views but no longer emitted by the builder fails **silently** — badges go blank or
stale, no error. That is exactly how the old `numericId`/`BUG-7` mismatch hid a broken, colliding ID
scheme. Centralizing the computed value in the builder shrinks the change surface to one function and
makes the three layers verifiable with a single `data.json` assertion.

## Gotchas
- The UI is static browser ES modules — there's no build/typecheck step and Node may be absent, so
  `node --check` isn't guaranteed. Lean on grep gates + a `data.json` shape assertion instead.
- After editing the canonical `_kit/INSTRUCTIONS.md`, regenerate the per-tool copies with
  `python3 _kit/install.py --global` — never hand-edit the generated `CLAUDE.md`.

# Related
- [[knowledge-kit]]
- [[feat-dashboard]]
- [[ses-2026-06-18-work-item-ids-and-generic-kit]]
