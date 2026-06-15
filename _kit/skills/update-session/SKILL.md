---
name: update-session
description: Capture in-progress work into the central knowledge vault. Reads the repo's .knowledge.json binding, creates or updates today's session file, surgically updates the affected feature info files (architecture, behaviors, edge cases, file map, open questions), applies ambient-documentation triggers, records touched source files, reconciles the spec, and rebuilds the dashboard data. Use mid-work to checkpoint what you've built or learned.
---

# /update-session

You are running the **update-session** command of the knowledge kit.

## 1. Resolve the binding
- Read `./.knowledge.json` (vault, project, author); `KNOWLEDGE_VAULT` env overrides `vault`.
- No binding → tell the user, offer `python3 <vault>/_kit/install.py --project .`, stop.

## 2. Load the rules
- Read `<vault>/_kit/INSTRUCTIONS.md` and `<vault>/_guide.md` fully and follow them.
- Every file you write obeys the **Living History** rule (INSTRUCTIONS.md): read the file fully,
  refresh current-state sections to today, append/compact the `## Evolution` trail.

## 2.5 Branch: did we review a PR?
- If this conversation reviewed a pull request (read/critiqued a diff, ran `code-review`, discussed
  PR findings, approved/requested changes) → run the **PR Review Flow** in INSTRUCTIONS.md:
  resolve/create the feature, then (for a bugfix) resolve/create the bug, then create the
  `pr-reviews/pr-YYYY-MM-DD-{desc}.md` entity and link PR ↔ bug ↔ feature. Use the visual,
  plain-language PR template from `_guide.md`. Then continue with steps 3-7 to log the session.
- Otherwise → continue with the normal flow below.

## 3. Session file
- Find or create today's `ses-YYYY-MM-DD-{desc}.md` under the right feature in
  `<vault>/projects/{project}/features/{feat}/sessions/`. Use the session template from
  `_guide.md`. Set `continues-from:`/`continues-in:` if continuing earlier work.

## 4. Feature-by-feature update (Read Before Write)
- Re-read the conversation. Identify ALL affected features (use the `feature-intelligence`
  skill to assign work). For EACH, read its `info-{name}.md` fully, then surgically update
  Architecture / Known Behaviors / Edge Cases / File Map / Open Questions.
- Apply every ambient-documentation trigger in INSTRUCTIONS.md (root cause, decision, behavior
  change, recurrence, decision replay, cross-feature impact radar).

## 5. File tracking
- Record every source file touched in the entity's `files:` YAML (with role) AND add new files
  to the feature's `## File Map`.

## 5.5 Skill extraction
- Scan the session for reusable patterns, gotchas, or architectural rules (criteria in INSTRUCTIONS.md §Skill Extraction).
- List `<vault>/projects/{project}/skills/` for existing skills (Read Before Write).
- For each qualified candidate: create or surgically update `skl-{name}.md` in the vault under `projects/{project}/skills/`.
- If `.knowledge.json` is in the current working directory (running from code repo): also write/update `.claude/skills/{category}/SKILL.md` using SKILL.md frontmatter (`name`, `description`, `origin: extracted-from-session-YYYY-MM-DD`) + same content body.
- **Register into the project's skill-gate tables** (when running from the code repo): classify each extracted skill into a lifecycle stage and idempotently add a row to that stage's gate table in `CLAUDE.md` (or the repo's primary AI instruction file) — **Pre-Check-in** (write-time, before commit) or **Pre-PR** (review-time). Create the `## {Stage} Skill Gate` section if missing; keep the set of tables small (≤3-4) so every skill falls under one. See INSTRUCTIONS.md §Skill Extraction.
- Tell the user what was extracted/updated and which gate table it was registered in, or skip silently if nothing qualifies.

## 6. Spec
- Reconcile `<vault>/projects/{project}/spec.md` if architecture/behaviors changed.

## 7. Rebuild dashboard data (mandatory)
- Run `python3 <vault>/dashboard/build_data.py`. Then list every file you created/modified.
