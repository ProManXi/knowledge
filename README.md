# Knowledge Vault

A plug-and-play **engineering knowledge system**. It turns the throwaway context of day-to-day
coding — why a bug happened, why an architecture choice was made, how a feature actually behaves —
into a permanent, searchable, navigable record, captured for you by Claude Code while you work.

One vault holds *every* project. You drive it with three commands. A dashboard visualizes it all.

---

## The problem it solves

When you pair with an AI assistant (or just work solo), knowledge evaporates the moment the chat
ends:

- **Lost rationale** — six weeks later nobody remembers *why* you picked X over Y.
- **Repeated debugging** — the same class of bug gets re-investigated from scratch.
- **Onboarding tax** — a new engineer (or a fresh Claude session) starts from zero.
- **Scattered notes** — what little gets written lives in random docs, PR descriptions, and Slack.
- **Drift across tools** — Claude, Cursor, Cline, and Copilot each need their own instruction file,
  hand-maintained and always out of sync.

This system fixes all of that with one structured vault and a single source of truth for behavior.

---

## How it works (three moving parts)

1. **The vault** — this repository. It stores all knowledge as plain Markdown with consistent YAML
   front-matter, organized as `projects → features → entities` (sessions, bugs, decisions,
   incidents, tickets, updates, analyses). Plain files = greppable, git-versioned, Obsidian-ready.

2. **The kit** (`_kit/`) — installs the behavior. It copies three launcher commands into
   `~/.claude/skills` so they work in *every* project, and connects each code repo to this vault
   with a tiny `.knowledge.json` pointer. One canonical instruction file (`_kit/INSTRUCTIONS.md`)
   is rendered into whatever each AI tool needs — edit it once, every tool updates.

3. **The dashboard** (`dashboard/`) — a static UI over `data.json`, which a pure-Python builder
   regenerates from the vault. No build step you maintain; the commands rebuild it for you.

### The three commands

| Command | When | What it does |
|---|---|---|
| `/startday` | Start of a session | Briefs you on what's open for this project; primes feature context |
| `/update-session` | Mid-work checkpoint | Writes today's session, updates the feature's living spec, records files touched |
| `/packup` | Wrapping up | Finalizes the session, captures next steps and any behavior changes |

Capture is **on-demand** — nothing is written until you run a command, so the system never edits
your work mid-flow. Each command ends by rebuilding the dashboard data.

> **Knowledge lives centrally, not in your code repo.** Your project gets one pointer file
> (`.knowledge.json`); the actual sessions/bugs/specs land here under `projects/<your-project>/`.
> Your code repository stays clean.

---

## Repository structure

```
knowledge/
  README.md            ← you are here
  CLAUDE.md            ← GENERATED from _kit/INSTRUCTIONS.md — do not hand-edit
  _guide.md            ← the schema bible: naming conventions, YAML, content templates
  _index.md            ← at-a-glance open bugs / incidents / tickets (Obsidian Dataview)

  _kit/                ← the plug-and-play package
    README.md          ← full install & usage walkthrough (start here to onboard)
    INSTRUCTIONS.md    ← THE single source of truth for AI behavior (edit only this)
    tools.json         ← registry of AI tools to generate config for
    install.py         ← installer / generator (Python, no dependencies)
    skills/            ← launcher commands: startday, update-session, packup, feature-intelligence

  dashboard/
    build_data.py      ← scans the vault → data.json (Python, no dependencies)
    index.html, css/, js/   ← static UI (reads data.json; never edited by hand)
    serve.sh           ← serve the dashboard locally

  projects/
    <project>/
      <project>.md     ← project hub (navigation)
      spec.md          ← reconciled project spec
      features/feat-<capability>/
        feat-<capability>.md   ← feature hub (navigation)
        info-<capability>.md   ← living specification: architecture, behaviors, edge cases, file map
        sessions/ bugs/ decisions/ incidents/ tickets/ updates/ analysis/
```

A **feature** is a *User Capability Domain* — what users can accomplish — never a UI component or
endpoint. The `feature-intelligence` skill enforces this and prevents overlapping features. The
**info file** is where all durable knowledge for a feature lives; everything else is an event in
time. Full rules, naming, and templates are in [`_guide.md`](_guide.md).

---

## Getting started

New here? Read **[`_kit/README.md`](_kit/README.md)** — it walks through install and daily use.
In short:

```bash
# once per machine — makes /startday, /update-session, /packup available everywhere
python3 /path/to/knowledge/_kit/install.py --global

# once per project — connect a repo to this vault
cd ~/Developer/yourproject
python3 /path/to/knowledge/_kit/install.py --project . --slug yourproject --author you

# then, inside the project in Claude Code:
/startday     ...work...     /update-session     ...work...     /packup
```

**Requirements:** Claude Code, `python3`, and a copy of this vault. No Node or .NET needed.

View the dashboard anytime: `cd dashboard && ./serve.sh`.

---

## Design principles

- **Single source of truth** — behavior is authored once in `_kit/INSTRUCTIONS.md`; per-tool files
  are generated between `KNOWLEDGE-KIT` markers, so a project's own rules are never clobbered.
- **Data is central, behavior is portable** — knowledge aggregates in one vault; the kit travels to
  any project.
- **Read before write** — every update reads the target file first and makes a surgical edit;
  contradictions are surfaced, never silently overwritten.
- **Plain files** — Markdown + YAML, so the vault is greppable, diffable, and tool-agnostic.
