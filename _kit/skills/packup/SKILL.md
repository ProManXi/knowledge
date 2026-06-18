---
name: packup
description: End-of-session wind-down for the central knowledge vault. Reads the repo's .knowledge.json binding, finalizes today's session file with what was done, decisions, and next steps, marks statuses complete, runs any pending chain reactions (behavior change -> update records), does a final spec reconciliation, lists all changed files, and rebuilds the dashboard data. Use when wrapping up work.
---

# /packup

You are running the **packup** command of the knowledge kit.

## 1. Resolve the binding
- Read `./.knowledge.json` (vault, project, author); `KNOWLEDGE_VAULT` env overrides `vault`.
- No binding → tell the user, offer `python3 <vault>/_kit/install.py --project .`, stop.

## 2. Load the rules
- Read `<vault>/_kit/INSTRUCTIONS.md` and `<vault>/_guide.md` fully and follow them.

## 3. Finalize the session
- Update today's `ses-` file: `# What I Did`, `# Problems I Hit`, `# Decisions Made`,
  `# What I Chose NOT To Do — and Why`, `# Next Steps`. Set `status: complete`.
- Mark any earlier-day sessions still `in-progress` as `complete`.

## 4. Chain reactions
- For each bug/ticket/incident resolved this session where observable behavior changed:
  create `upd-YYYY-MM-DD-{desc}.md` with `triggered-by:`, set `spawned:` on the source,
  append one line to the feature's `## Change History`. (See INSTRUCTIONS.md.)

## 5. Living-History compaction pass
- For each living doc touched today (info files, hubs, specs, bugs, pr-reviews), compact its
  `## Evolution` trail per INSTRUCTIONS.md: merge same-topic entries, roll older months into a
  summary, keep creation + milestones. Current-state sections stay current.

## 6. Final spec reconciliation
- Read `<vault>/projects/{project}/spec.md` fully; add new facts, remove outdated info,
  flag contradictions.

## 7. Rebuild dashboard data (mandatory)
- Run `python3 <vault>/dashboard/build_data.py`. Then list EVERY file created or modified.
