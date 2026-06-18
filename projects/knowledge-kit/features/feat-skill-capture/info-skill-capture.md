---
type: feature
title: Skill Capture — Info
project: knowledge-kit
feature: feat-skill-capture
status: active
role: info
author: robin
date: 2026-06-14
tags: [skills, update-session, knowledge-extraction]
---

# Current Architecture

### Components
- **`_kit/INSTRUCTIONS.md`** — canonical rules engine (single source of truth). Defines the Skill Extraction procedure, criteria, and extraction process. `install.py` renders this into every tool's format — never hand-edit generated copies.
- **`_guide.md`** — naming conventions, YAML schemas, and content templates. Contains the `skl-` entity type definition, status vocabulary, and `skl-{name}.md` content template.
- **`_kit/skills/update-session/SKILL.md`** — step-by-step update-session instructions; step 5.5 is the skill extraction step.
- **`projects/{slug}/skills/`** — per-project folder where vault skill entities live.
- **`.claude/skills/{category}/SKILL.md`** (code repo) — repo-side copy written by update-session when run from the repo root; used by Claude directly when coding.

### Known Behaviors
- Skill extraction runs as the skill step of `update-session` (launcher step 5.5, after file tracking, before spec reconciliation).
- Extraction is automatic but conservative: only write when 2+ criteria are met (generalizable, actionable, non-obvious, reusable).
- **Two kinds of trigger**: (1) reusable *patterns/gotchas/rules* discovered while building, and (2)
  **gap-driven** skills — a knowledge gap that *caused* a bug, work that wasn't/couldn't be reviewed,
  or a recurring gotcha worth remembering for the product. Gap-driven skills are phrased
  forward-looking ("When you touch X, verify Y because Z"), not as a retelling of the incident.
- **Dedup-check FIRST**: before writing, verify the knowledge isn't already in this project's
  `skills/`, the repo's `.claude/skills/`, or elsewhere in the vault (other projects' `skills/` and
  `info-*.md`). If it exists → strengthen that skill; if better placed in an info file → skip.
- If nothing qualifies → skip silently. Never force-extract.
- Vault entity uses full vault YAML frontmatter (`type`, `title`, `project`, `features`, `category`, `status`, `derived-from`, `repo-path`) — **no `id:` field** (removed with the synthetic-ID scheme).
- Repo SKILL.md uses skill-specific frontmatter (`name`, `description`, `origin: extracted-from-session-YYYY-MM-DD`) — different format, same content body.
- `build_data.py` picks up skill entities automatically (walks all `.md` under `projects/`).

### Edge Cases
- Running `update-session` from inside the vault (no `.knowledge.json` in CWD): vault entity is written, but the repo-copy step and gate-table registration are skipped (no repo path known).
- Skills span multiple features: use the `features:` YAML list (array of feature slugs) rather than picking just one.
- Existing `.claude/skills/` hand-authored files must not be overwritten — only create/update files that either don't exist or were previously extracted (check `origin:` field for `extracted-from-session`).

## File Map
- `_kit/INSTRUCTIONS.md` — canonical rules; §Skill Extraction defines the full procedure
- `_guide.md` — schemas and templates; `skl-` entity added 2026-06-14
- `_kit/skills/update-session/SKILL.md` — step 5.5 added 2026-06-14
- `projects/{slug}/skills/skl-{name}.md` — vault skill entities (per project)

## Integration Points
- **feat-dashboard**: the Skills tab (`dashboard/js/views/skills.js`) reads `type === 'skill'` entities. Badge count `skill-count` updated in `app.js`. `build_data.py` picks up vault skills automatically with no code change.

## Open Questions
- Should `packup` also run skill extraction (final review pass)? Currently only `update-session` does.
- Should `startday` prime skill context (read relevant skills before coding)?

## Evolution
- 2026-06-14 — Created. Skill Capture feature: `skl-` entity, update-session step 5.5, repo copy + gate-table registration.
- 2026-06-18 — Added **gap-driven extraction** (gaps that caused bugs / unreviewed work / recurring
  gotchas) and a **dedup-check-first** rule (project skills + repo `.claude/skills` + rest of vault)
  before writing. Dropped the now-removed `id:` field from the vault skill frontmatter description.

# Related
- [[feat-skill-capture]]
