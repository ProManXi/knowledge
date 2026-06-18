---
type: session
title: Build PR Review Capture feature + Living History rule
project: knowledge-kit
feature: feat-pr-review
status: complete
author: robin
date: 2026-06-15
tags: [pr-review, living-history, update-session, dashboard]
files:
  - path: _kit/INSTRUCTIONS.md
    role: modified
  - path: _guide.md
    role: modified
  - path: _kit/skills/update-session/SKILL.md
    role: modified
  - path: _kit/skills/startday/SKILL.md
    role: modified
  - path: _kit/skills/packup/SKILL.md
    role: modified
  - path: dashboard/build_data.py
    role: modified
  - path: dashboard/index.html
    role: modified
  - path: dashboard/js/views/pr-reviews.js
    role: created
  - path: dashboard/js/app.js
    role: modified
  - path: dashboard/js/components/navigation.js
    role: modified
  - path: dashboard/js/utils.js
    role: modified
---

# What I Did
- Added a **PR Review** entity type (`pr-review`, folder `pr-reviews/`, `pr-YYYY-MM-DD-{desc}.md`) with
  schema and a visual, plain-language content template in `_guide.md`.
- Added **§PR Review Flow** to `_kit/INSTRUCTIONS.md`: the cascade that creates a feature (if missing)
  and a bug (if the PR is a bugfix and none exists) before creating the PR review, linking everything.
- Made `update-session` branch on "did we review a PR?" (Step 0 / launcher step 2.5).
- Introduced the cross-cutting **Living History (Temporal Updates)** rule: every doc write refreshes
  current-state sections and appends/compacts a dated `## Evolution` trail. Wired into `packup`
  (compaction pass) and the ambient-trigger table.
- Dashboard: new **PR Reviews** tab (`pr-reviews.js`, nav item, badge `pr-count`), excluded PR reviews
  from the **Connections graph** in `build_data.py`, added PR stats, and registered work-item
  prefix/icon/color in `utils.js`.
- Verified the existing **Skill Capture** feature wiring and reinforced that every skill must carry a
  `project:` field and a `[[{project}]]` link.

# Decisions Made
- PR reviews are kept out of Connections (per request) by dropping their nodes/edges in
  `build_relationship_graph`, but remain visible in the sidebar tree and the dedicated tab.
- Non-bugfix PRs link to the feature only (no bug); `kind` records bugfix/feature/refactor/chore.
- PR metadata is conversation-sourced; `gh` enrichment optional, never required.

# Next Steps
- Use the flow on a real PR review to validate the cascade end-to-end.
- Consider auto Chain-Reaction `upd-` records when a merged PR changes observable behavior.

# Related
- [[feat-pr-review]]
- [[info-pr-review]]
- [[skl-living-history-compaction]]
