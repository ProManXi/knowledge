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

## 6. Spec
- Reconcile `<vault>/projects/{project}/spec.md` if architecture/behaviors changed.

## 7. Rebuild dashboard data (mandatory)
- Run `python3 <vault>/dashboard/build_data.py`. Then list every file you created/modified.
