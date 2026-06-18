---
type: feature
title: Dashboard — Info
project: knowledge-kit
feature: feat-dashboard
status: active
role: info
author: robin
date: 2026-06-14
tags: [dashboard, ui, data-pipeline]
---

# Current Architecture

### Components
- **`build_data.py`** — Python script; walks all `.md` under `projects/`, parses YAML frontmatter, builds `data.json`. Run after every vault write. Scans all entity types automatically — new folders under `projects/` are picked up with no code change. **Also computes each entity's display badge** via `work_item_label(yaml, slug)` and attaches it as `workItem` on every entity, timeline item, and graph node.
- **`data.json`** — single static file consumed by the UI; never hand-edited.
- **`index.html`** — layout: sidebar nav (260px) + header (56px) + scrolling view sections. Views switched via `data-view` attributes on nav items.
- **`js/app.js`** — entry point; boots app, registers VIEW_RENDERERS, updates badge counts via `updateBadgeCounts()`.
- **`js/data.js`** — single data store; exposes `loadData()`, `getData()`.
- **`js/utils.js`** — `sanitize()`, `statusBadge()`, `severityBadge()`, `humanizeId()`, and `workItemId(entity)` (returns the builder-computed `workItem`).
- **`js/components/navigation.js`** — sidebar routing; `getCurrentProject()`, `VIEW_TITLES` map.
- **`js/views/*.js`** — one renderer per view; all follow the same import pattern.

### Known Behaviors
- All data is loaded once at startup from `data.json` — no API calls.
- Project dropdown filters all views in-memory by `e.yaml.project`.
- Badge counts are updated on initial load and on every project filter change via `updateBadgeCounts()`.
- `build_data.py` walks ALL `.md` files under `projects/` — new entity types/folders appear automatically in the entity list without any code change.
- **Work-item badge**: every row's ID badge is the builder-computed `workItem`. When the entity has a
  real tracker ref it shows it the tracker's way — GitHub/GitLab `#24`, Azure `AB#5678`, Jira/Linear
  `PROJ-42`; otherwise a typed date/name fallback (`SES·2026-06-18`, `DEC·delta-push`). There is **no**
  synthetic auto-increment ID — `numericId` was removed; views never format IDs themselves, they render
  `workItem`.

### Edge Cases
- Browser caches `index.html` and JS aggressively. After changes, users must hard-refresh (Cmd+Shift+R) or use a new port.
- **Schema/label changes move in lockstep across three layers** — `_guide.md` (schema) → `build_data.py`
  (`work_item_label` + what it attaches) → the view renderers. Skip one and badges silently go blank or
  stale (that's exactly how the old `numericId` mismatch hid). See [[skl-schema-change-three-layer-lockstep]].

## File Map
- `dashboard/build_data.py` — Python scanner; vault → data.json
- `dashboard/data.json` — generated; never hand-edit
- `dashboard/index.html` — app shell; sidebar nav + view sections
- `dashboard/js/app.js` — boot, VIEW_RENDERERS registration, badge counts
- `dashboard/js/data.js` — data store, loadData/getData
- `dashboard/build_data.py` — also `work_item_label()`; attaches `workItem` to entities/timeline/nodes (replaced `numericId`)
- `dashboard/js/utils.js` — sanitize, statusBadge, severityBadge, humanizeId, `workItemId(entity)` → `workItem`
- `dashboard/js/components/navigation.js` — routing, getCurrentProject, VIEW_TITLES
- `dashboard/js/views/overview.js` — overview tab; renders `workItem`
- `dashboard/js/views/tracking.js` — reusable table for bugs/incidents/tickets/updates/sessions
- `dashboard/js/views/{entity-content,work-items,timeline,feature-content,post-mortem,tags,daily-summary,graph}.js` — all render `workItem` (no `numericId`)
- `dashboard/js/views/skills.js` — skills tab (added 2026-06-14)
- `dashboard/css/app.css` — dark theme with CSS variables

## Integration Points
- **feat-skill-capture**: `build_data.py` auto-scans `projects/{slug}/skills/` for skill entities; the Skills tab renderer (`skills.js`) reads `type === 'skill'` entities from the data store.
- **feat-pr-review**: PR badges (`#24`) come from the same `work_item_label` path; pr-reviews stay excluded from the Connections graph.

## Open Questions
- Should `build_data.py` auto-build `ref-url` from `.knowledge.json`'s `repo-url` + `ref-id` when `ref-url` is omitted?

## Evolution
- 2026-06-14 — Skills tab added (`skills.js`, `skill-count` badge); `build_data.py` auto-scans skills.
- 2026-06-18 — Removed synthetic auto-increment IDs (`numericId`/`BUG-7`). The builder now computes a
  `work_item_label` — the real tracker ref (`#24`/`AB#5678`/`PROJ-42`) or a typed date/name fallback —
  and attaches it as `workItem`; all ~13 view call sites and `workItemId` updated to render it.

# Related
- [[feat-dashboard]]
