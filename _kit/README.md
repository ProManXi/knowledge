# Knowledge Kit — Onboarding

> Persistent engineering memory for any project, driven from Claude Code (and Cursor/Cline/Copilot).
> You keep coding normally; three commands keep a searchable knowledge vault + dashboard up to date.

---

## What it is (the 30-second pitch)

Every time you solve a bug, make an architecture decision, or learn how a feature really works,
that knowledge normally evaporates when the chat ends. This kit captures it into a **central
vault** — one place that holds *every* project's sessions, bugs, decisions, incidents, and a
living spec per feature — and renders a **dashboard** so you can see it all.

You drive it with three commands inside Claude Code:

| Command | When | What it does |
|---|---|---|
| `/startday` | Start of a work session | Briefs you on what was open for this project, primes context |
| `/update-session` | Mid-work checkpoint | Writes today's session, updates the feature's living spec, records files touched |
| `/packup` | Wrapping up | Finalizes the session, next steps, behavior-change records |

Two ideas make it "plug and play":

1. **The kit installs once per machine** (into `~/.claude`), so the three commands exist in
   *every* project automatically — but stay silent until you call them.
2. **Knowledge data lives in one central vault, not in your code repo.** A repo is "connected"
   by a single tiny file (`.knowledge.json`) that says *which vault* and *which project*. Your
   code repo stays clean.

---

## Prerequisites

- **Claude Code** (you already use it).
- **python3** — the kit's builder/installer run on it. (Macs ship with it; check `python3 --version`.)
- **A copy of the vault** on your machine. The vault *is* the package — it contains `_kit/`,
  `_guide.md`, the `dashboard/`, and all `projects/`. Put it anywhere, e.g. `~/Developer/knowledge`.

> No Node or .NET required. The dashboard builder is pure Python.

---

## Install — two steps, done once each

### Step 1 — install the kit on your machine (once per machine)

```bash
python3 ~/Developer/knowledge/_kit/install.py --global
```

This copies the launcher skills into `~/.claude/skills/` (so `/startday`, `/update-session`,
`/packup` work in any project) and regenerates the vault's own `CLAUDE.md`.

### Step 2 — connect your project to the vault (once per project)

```bash
cd ~/Developer/coolapp                       # your new project
python3 ~/Developer/knowledge/_kit/install.py --project . --slug coolapp --author yourname
```

This writes `coolapp/.knowledge.json` and generates rule files for the other AI tools you use.
`--slug` is the folder name your knowledge lands under in the vault (defaults to the repo folder
name); `--author` defaults to `robin`.

That's it. There's no vault scaffolding to create by hand — the first time you run `/startday`
in a brand-new project, Claude notices the project doesn't exist in the vault yet and offers to
set it up (project hub + first feature + living spec), then starts your first session.

---

## Daily use

```
cd ~/Developer/coolapp        # open the project in Claude Code as usual
/startday                     # "Here's what was open for coolapp… what are we doing today?"
... build, debug, decide, ask Claude things ...
/update-session               # checkpoint: writes the session + updates the feature spec
... more work ...
/packup                       # finalize: next steps, mark things done
```

You never edit the vault by hand. Every command ends by rebuilding `dashboard/data.json`.

### See the dashboard

```bash
cd ~/Developer/knowledge/dashboard
./serve.sh          # serves the static UI; open the printed localhost URL
```

The UI reads `data.json` — the file the three commands keep fresh. You do not edit the UI.

---

## What your project looks like before vs after

**Before** — your normal repo:
```
coolapp/
  src/  tests/  package.json  README.md  CLAUDE.md   ← your own coding rules (untouched)
```

**After connecting** — only small, clearly-marked additions:
```
coolapp/
  src/  tests/  package.json  README.md
  CLAUDE.md                       ← UNTOUCHED — still your coding rules
  .knowledge.json                 ← NEW: { vault, project slug, author }  ← the only required file
  .cursorrules                    ← generated (only if you use Cursor)
  .clinerules                     ← generated (only if you use Cline)
  .github/copilot-instructions.md ← generated (only if you use Copilot)
```

Your actual **knowledge** is *not* in this repo — it's in the central vault:
```
~/Developer/knowledge/projects/coolapp/
  coolapp.md                      ← project hub
  spec.md                         ← reconciled project spec
  features/feat-<capability>/
    info-<capability>.md          ← the living specification (architecture, behaviors, edge cases, file map)
    sessions/  bugs/  decisions/  incidents/  tickets/  updates/  analysis/
```

If you only use Claude Code and don't want the `.cursorrules`/`.clinerules`/`.github` files,
disable those tools in `_kit/tools.json` and re-run — only `.knowledge.json` is mandatory.

---

## Using a different / new AI tool

The kit renders one canonical instruction file (`_kit/INSTRUCTIONS.md`) into each tool's format.
To support a tool that isn't listed:

```bash
python3 ~/Developer/knowledge/_kit/install.py add-tool windsurf --target .windsurfrules
python3 ~/Developer/knowledge/_kit/install.py --project .       # re-emit files
```

You edit behavior in exactly one place (`INSTRUCTIONS.md`) and re-run; every tool's file updates.
No more hand-syncing four copies.

---

## Troubleshooting

- **`/startday` says the repo isn't connected** → you skipped Step 2. Run
  `python3 <vault>/_kit/install.py --project .` in the repo.
- **Knowledge landed in the wrong folder** → your `--slug` didn't match the vault folder. Edit
  the `project` field in `.knowledge.json`.
- **Dashboard looks stale** → run `python3 <vault>/dashboard/build_data.py` (the commands do this
  automatically; this is the manual fallback).
- **Moved the vault folder** → update the `vault` path in each repo's `.knowledge.json`, or set a
  `KNOWLEDGE_VAULT` environment variable (it overrides the file).
```
