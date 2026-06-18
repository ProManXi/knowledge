---
type: session
title: Skills Feature — Design and Implementation
date: 2026-06-14
project: knowledge-kit
feature: feat-skill-capture
status: in-progress
author: robin
tags: [skills, dashboard, planning, implementation]
files:
  - path: _guide.md
    role: modified
  - path: _kit/INSTRUCTIONS.md
    role: modified
  - path: _kit/skills/update-session/SKILL.md
    role: modified
  - path: dashboard/index.html
    role: modified
  - path: dashboard/js/app.js
    role: modified
  - path: dashboard/js/components/navigation.js
    role: modified
  - path: dashboard/js/views/skills.js
    role: created
  - path: projects/my-loop/skills/.gitkeep
    role: created
  - path: projects/knowledge-kit/knowledge-kit.md
    role: created
  - path: projects/knowledge-kit/features/feat-dashboard/feat-dashboard.md
    role: created
  - path: projects/knowledge-kit/features/feat-dashboard/info-dashboard.md
    role: created
  - path: projects/knowledge-kit/features/feat-skill-capture/feat-skill-capture.md
    role: created
  - path: projects/knowledge-kit/features/feat-skill-capture/info-skill-capture.md
    role: created
---

# What I Did
Designed and implemented the skills capture system for the knowledge vault from scratch.

**Planning phase**: Explored the full dashboard architecture (data pipeline, view pattern, registration
flow), the `update-session` skill steps, the `.claude/skills/` format in `my_loop`, and the binding
model. Surfaced a critical design question: skills in `my_loop/.claude/skills/` already exist as
hand-authored Claude operational skill files — the new feature needed to extend that concept, not
conflict with it. Resolved via user Q&A: same concept, vault-primary storage, repo secondary copy.

**Implementation**:
- `_guide.md` — added `skill` entity type: folder structure, naming convention (`skl-`), YAML schema
  (`features`, `category`, `repo-path`, `derived-from`), status vocabulary, and content template.
- `_kit/INSTRUCTIONS.md` — added `skill` row to Entity Detection and Ambient Triggers tables; new
  `## Skill Extraction` section with 4 criteria (generalizable, actionable, non-obvious, reusable),
  do-not-extract list, and 6-step extraction process. Updated `update-session` step count to 8
  (step 6 = skill extraction, step 7 = spec, step 8 = rebuild).
- `_kit/skills/update-session/SKILL.md` — added step 5.5 (skill extraction) between file tracking
  and spec reconciliation.
- `dashboard/index.html` — new "Skills" nav item (lightbulb icon, yellow badge `skill-count`) and
  `view-skills` section.
- `dashboard/js/views/skills.js` — new renderer; groups skills by category (gotchas first), renders
  feature badges and derived-from link, click → entity detail panel.
- `dashboard/js/app.js` — imported `renderSkills`, registered in `VIEW_RENDERERS`, added
  `skill-count` to `updateBadgeCounts()`.
- `dashboard/js/components/navigation.js` — added `skills: 'Skills'` to `VIEW_TITLES`.
- Created `projects/my-loop/skills/` scaffold.

**Post-implementation**: Created `knowledge-kit` project in the vault to track vault system work.

# Problems I Hit
- `build_data.py` change not needed — it already walks all `.md` under `projects/` so skill entities
  are auto-scanned. Avoided an unnecessary change.
- Browser cached the old `index.html` — user couldn't see the Skills tab. Resolved by launching a
  fresh server on port 3001 (no code change needed).

# Decisions Made
- Skills are vault-primary (stored in vault as `skl-` entities), repo-secondary (SKILL.md copy
  written to `.claude/skills/` when running from repo root).
- Skills use the SAME SKILL.md format/concept as the existing hand-authored `.claude/skills/` files
  — they are the same thing, just auto-extracted.
- Skill extraction is conservative: only extract when 2+ criteria met; skip silently otherwise.
- Skills live at project level (`projects/{slug}/skills/`), not under a specific feature, because
  they often span features. Feature association via `features:` YAML list.

# What I Chose NOT To Do — and Why
- Did NOT change `build_data.py` — it already scans everything; change would be pure noise.
- Did NOT import existing `.claude/skills/` files into vault — user can do this incrementally as
  sessions run; no need to bulk-import now.
- Did NOT add skill extraction to `packup` or context priming to `startday` — keeping scope tight;
  flagged as open questions in `info-skill-capture.md`.

# Next Steps
- Run a real `update-session` from `my_loop` to see skill extraction fire for the first time.
- Decide: should `packup` also do a final skill review pass?
- Decide: should `startday` prime skill context?

# Related
- [[feat-skill-capture]]
- [[feat-dashboard]]
