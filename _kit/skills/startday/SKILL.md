---
name: startday
description: Begin a work session connected to the central knowledge vault. Reads the repo's .knowledge.json binding, gives a Morning Brief of open items for this project, asks what you're working on, primes feature context, and rebuilds the dashboard data. Use at the start of a coding day or when picking up work in a bound repo.
---

# /startday

You are running the **startday** command of the knowledge kit.

## 1. Resolve the binding
- Read `./.knowledge.json` in the current working directory (the code repo root).
  Get `vault`, `project`, `author`. Honor a `KNOWLEDGE_VAULT` env var over the file's `vault`.
- If no binding exists: tell the user this repo isn't connected to a vault and offer to run
  `python3 <vault>/_kit/install.py --project .`. Do not invent a vault path. Stop here.

## 2. Load the rules
- Read `<vault>/_kit/INSTRUCTIONS.md` and `<vault>/_guide.md` fully. Follow them — they are the
  source of truth; this skill is only the launcher.

## 3. Morning Brief
- Scan `<vault>/projects/{project}/` for open/in-progress bugs, tickets, incidents and the most
  recent sessions/analyses. Group by feature. Present the brief.
- Ask: *"Continue one of these, or start something new?"* — skip if intent is already clear.

## 4. Prime context
- For the chosen feature, read `info-{name}.md` fully, skim its `## File Map`, scan the last
  2-3 entity files. Summarize what you know before work begins.
- If it's a new project/feature, follow the onboarding/scaffolding flow in INSTRUCTIONS.md.

## 5. Rebuild dashboard data (mandatory)
- Run: `python3 <vault>/dashboard/build_data.py`
- Report success or the error. Never claim it updated if the command failed.
