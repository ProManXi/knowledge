---
type: session
title: Replace synthetic IDs with real work-item IDs; make the kit generic
project: knowledge-kit
feature: feat-dashboard
status: complete
author: robin
date: 2026-06-18
tags: [work-item-id, dashboard, schema, generic, content-style, skill-capture]
files:
  - path: _guide.md
    role: modified
  - path: _kit/INSTRUCTIONS.md
    role: modified
  - path: _kit/skills/update-session/SKILL.md
    role: modified
  - path: _kit/install.py
    role: modified
  - path: dashboard/build_data.py
    role: root-cause
  - path: dashboard/js/utils.js
    role: root-cause
  - path: dashboard/js/views/entity-content.js
    role: modified
  - path: dashboard/js/views/tracking.js
    role: modified
  - path: dashboard/js/views/work-items.js
    role: modified
  - path: dashboard/js/views/timeline.js
    role: modified
  - path: dashboard/js/views/overview.js
    role: modified
  - path: dashboard/js/views/feature-content.js
    role: modified
  - path: dashboard/js/views/post-mortem.js
    role: modified
  - path: dashboard/js/views/tags.js
    role: modified
  - path: dashboard/js/views/daily-summary.js
    role: modified
  - path: dashboard/js/views/graph.js
    role: modified
  - path: _index.md
    role: modified
---

# What I Did

The vault used to stamp every entity with an auto-increment integer `id:` and the dashboard turned
it into a synthetic badge like `BUG-7`. That scheme was quietly broken — the integers **collided**
(IDs 81–90 each existed in two different projects) and were inconsistently quoted. I ripped the whole
synthetic-ID idea out and replaced it with the entity's **real work-item reference** from whatever
tracker the project uses, so a badge now means something a human can click through to.

- **Schema (`_guide.md`)** — removed the universal `id:` field; added a structured work-item block
  (`tracker` + `ref-id` + `ref-url`) for tracked entities. Folded the old `pr-number`/`pr-url` and
  ticket `linked-ref` into it. Added a **Content Style** section (storyteller narrative + tables when
  the data is definite) and genericized example names.
- **Builder (`build_data.py`)** — deleted `numericId` parsing; added `work_item_label(yaml, slug)`
  which emits the real ref formatted per tracker, or a typed date/name fallback when none exists. The
  label is attached as `workItem` to every entity, timeline item, and graph node.
- **Dashboard JS** — `utils.js` `workItemId(entity)` now just returns the precomputed `workItem`;
  extended `humanizeId` to cover `anl|skl|pr`. Updated all ~13 call sites across the views to pass the
  object instead of `(type, numericId)`.
- **Capture rules (`INSTRUCTIONS.md` + `update-session` SKILL)** — added the **Work-Item Identity**
  rule (never invent an ID; no `id:` field), made the fan-out explicit (N resolved/reviewed items ⇒ N
  entities), and turned Skill Extraction into a **gap-driven, dedup-first** process.
- **Migration** — stripped `id:` from all 36 entity files; backfilled 5 PR reviews to real
  `tracker: github` + `ref-id` (#24/#25/#26/#44/#45). Nothing was guessed.
- **Plug-and-play** — `install.py --project` now accepts `--tracker`/`--repo-url` and writes them into
  `.knowledge.json`. Fixed the dangling `[[ai-workday]]` link and listed all six real projects in
  `_index.md`.

How the badge resolves now:

| Entity has… | Badge shown | Example |
|---|---|---|
| `tracker: github` + `ref-id` | `#<ref>` | `#24` |
| `tracker: azure` + `ref-id` | `AB#<ref>` | `AB#5678` |
| `tracker: jira`/`linear` + `ref-id` | key verbatim | `PROJ-42` |
| no tracker (sessions, decisions, skills…) | `PREFIX·date-or-slug` | `SES·2026-06-18` |

# Problems I Hit
- The integer IDs weren't just ugly, they collided across projects — proof the auto-increment idea
  could never be made correct. Removing it was the only real fix.
- `numericId` was threaded through the builder AND ~13 view call sites. Centralizing the label in
  `build_data.py` (one `workItem` string per object) avoided per-view formatting drift.
- Node isn't installed, so I couldn't `node --check` the views; verified instead via grep gates
  (no `numericId`, no `^id:`) and a `data.json` shape assertion.

# Decisions Made
- **Structured work-item fields** (`tracker`/`ref-id`/`ref-url`) over a single free-form string —
  queryable and tracker-aware for badge formatting.
- **Typed date/name fallback** for trackerless entities rather than hiding the badge — every row
  keeps a stable, non-synthetic identifier.
- **No new feature.** Per feature-intelligence, work-item identity is a sub-capability of
  feat-dashboard (its builder + views own the display) plus a cross-cutting authoring rule (like
  Living History / Content Style) — creating `feat-work-item-identity` would overlap Dashboard.
- **Label computed in the builder**, not the UI, so the static views just render a string.

# What I Chose NOT To Do — and Why
- Did **not** backfill `ref-id` on bugs/sessions that merely *mention* a PR/issue in prose — those
  weren't filed as their own tracker items, and the rule is never to guess an ID. They show the
  typed fallback, which is honest.
- Did **not** create a new feature for work-item identity (see Decisions).

# Next Steps
- Use the new fan-out + gap-driven skill flow on a real multi-bug review session to validate it.
- Consider teaching `build_data.py` to auto-build `ref-url` from `.knowledge.json`'s `repo-url` +
  `ref-id` when `ref-url` is omitted.

# Related
- [[feat-dashboard]]
- [[info-dashboard]]
- [[feat-skill-capture]]
- [[feat-pr-review]]
- [[skl-schema-change-three-layer-lockstep]]
