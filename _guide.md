# Engineering Knowledge System — Field Guide

## Concept

One vault. Every project. Every feature. Every session, analysis, bug, ticket, incident, update and decision.
All connected as a navigable tree. Plug and play for any project in the world.
Analytics-ready by design — every file has consistent YAML queryable via Obsidian Dataview.

---

## Folder Structure

```
knowledge/
  _index.md                          <- vault root: lists all projects
  _guide.md                          <- this file

  projects/
    {project}/
      {project}.md                   <- project hub
      systems/                       <- ONLY shared cross-feature infrastructure
        sys-{name}.md
      features/
        {feat}/
          {feat}.md                  <- feature hub: navigation only (Dataview queries — never add prose here)
          info-{name}.md             <- living specification: what it is, how it works, known behaviors
          sessions/                  <- daily work logs
          analysis/                  <- exploratory investigations (no code change)
          bugs/                      <- defects
          tickets/                   <- customer-reported issues
          incidents/                 <- production failures
          updates/                   <- feature changes (add/modify/remove/deprecate)
          decisions/                 <- technical choices and what was rejected

      analysis/                      <- cross-feature or architectural investigations
```

---

## Naming Conventions

| Entity    | Prefix  | Pattern                        | Example                                    |
|-----------|---------|--------------------------------|--------------------------------------------|
| Project   | —       | `{name}`                       | `ai-workday`                               |
| Feature   | `feat-` | `feat-{name}`                  | `feat-payment-retry`                       |
| Info      | `info-` | `info-{name}`                  | `info-payment-retry`                       |
| Session   | `ses-`  | `ses-YYYY-MM-DD-{description}` | `ses-2026-05-22-debug-payment-timeout-issue` |
| Bug       | `bug-`  | `bug-YYYY-MM-DD-{description}` | `bug-2026-05-23-file-upload-fails-on-mobile` |
| Ticket    | `tkt-`  | `tkt-YYYY-MM-DD-{description}` | `tkt-2026-05-24-ai-summary-slow-responses` |
| Incident  | `inc-`  | `inc-YYYY-MM-DD-{description}` | `inc-2026-05-23-payment-api-timeout-under-load` |
| Update    | `upd-`  | `upd-YYYY-MM-DD-{description}` | `upd-2026-05-25-switch-ai-model-to-claude` |
| Decision  | `dec-`  | `dec-{name}`                   | `dec-payment-retry-limit-strategy`         |
| Analysis  | `anl-`  | `anl-YYYY-MM-DD-{description}` | `anl-2026-05-22-understand-retry-lock-behavior` |
| System    | `sys-`  | `sys-{name}`                   | `sys-payment-api`                          |

Rules:
- Minimum 3 words in the description part of the name (prefer 4+ for clarity)
- Sessions, bugs, tickets, incidents, updates, analyses: date-first (events in time)
- Decisions and systems: no date in name (permanent knowledge — date goes in YAML only)
- Systems: shared infrastructure only — feature-specific system info lives in the info file
- Use lowercase kebab-case for all descriptions

---

## YAML Schema

### Universal fields (every file)

```yaml
id:       # unique auto-increment integer (never reused, even after deletion)
type:     # project | feature | session | analysis | bug | ticket | incident | update | decision | system
title:    # human-readable display name (used by dashboard and graph)
date:     # YYYY-MM-DD
project:  # project name
feature:  # feat-name  (omit for project-level files and systems)
author:   # engineer who created this
status:   # see per-type values below
tags:     # [free, form, labels]
```

### Role field (feature + system + project files only)

```yaml
role:     # hub | info | system
          # hub     — feature hub or project hub (navigation only)
          # info    — feature living specification
          # system  — shared infrastructure file
          # omit for all other entity types (sessions, bugs, tickets, etc.)
```

### Per-type additional fields

```yaml
# project
name:     # project slug (matches folder name)

# bug
severity: critical | high | medium | low

# ticket
severity: critical | high | medium | low
customer: customer or team name
linked-ref: EXT-1234   <- external ticket system ID (optional)

# incident
severity: critical | high | medium | low
impact:   description of blast radius

# decision
prompted-by: "[[bug-|tkt-|inc-|ses-]]"   <- what caused this decision (omit if initial design choice)

# update
change-type:  add | modify | remove | deprecate
triggered-by: "[[inc-or-bug-that-caused-this]]"   <- chain link
spawned:      "[[upd-created-as-result]]"          <- set on the incident/bug that triggered it
```

### Files field (all work entities — session, bug, ticket, incident, analysis, update)

```yaml
files:      # list of source code files touched, analyzed, or relevant to this work
  - path: src/services/sync-gateway.ts
    role: modified              # modified | analyzed | root-cause | created | deleted
  - path: tests/sync.test.ts
    role: created
  - path: src/lib/delta-engine.rs
    role: analyzed
```

Roles:
- `modified` — file was changed as part of this work
- `analyzed` — file was read/investigated to understand behavior
- `root-cause` — the bug or defect lives in this file
- `created` — new file introduced
- `deleted` — file was removed

Rules:
- Use workspace-relative paths (from project root)
- Record files as you work — don't wait until the end
- Include test files if they were added or changed
- For bugs: always mark the root-cause file(s)

### Status vocabulary

| Type | Valid statuses |
|------|---------------|
| project | active, archived |
| feature | active, deprecated, removed |
| session | complete |
| analysis | complete, in-progress |
| bug | open, in-progress, resolved, wont-fix, duplicate |
| ticket | open, in-progress, resolved, wont-fix |
| incident | open, investigating, mitigated, resolved |
| update | planned, in-progress, implemented, reverted |
| decision | proposed, active, superseded, revoked |
| system | active, deprecated, decommissioned |

---

## Content Templates

### Project Hub  `{project}.md`  — navigation only

```markdown
# {Project Title}

## Features

```dataview
TABLE status FROM "projects/{project}/features" WHERE role = "hub" SORT file.name ASC
```

## Systems

```dataview
TABLE status FROM "projects/{project}/systems" SORT file.name ASC
```
```

---

### Feature Hub  `{feat}.md`  — navigation only

```markdown
# {Feature Title}

## Key Behaviors
  <!-- 2-3 line summary of what this feature does -->

# Related
- [[{project}]]
```

---

### Feature Info  `info-{name}.md`  — all knowledge lives here

```markdown
# Current Architecture
### Components
### Known Behaviors
### Edge Cases

## File Map
  <!-- Key source files for this feature — updated as work happens -->
  <!-- Format: `path/to/file.ext` — one-line description of what it does -->
  <!-- Example:
  - `src/services/sync-gateway.ts` — WebSocket connection manager, handles reconnect logic
  - `src/lib/delta-engine.rs` — Binary diff computation, rsync algorithm implementation
  - `tests/sync.test.ts` — Integration tests for real-time sync flows
  -->

## Integration Points
## Open Questions

# Related
- [[{feat}]]
```

### Analysis  `anl-YYYY-MM-DD-{description}.md`

```markdown
# Goal
  <!-- What were you trying to understand? -->
# What I Found
# Open Questions
  <!-- Things you still don't know — creates a trail for the next investigation -->
# Diagrams or Code Snippets
# Follow-up Actions
  <!-- If nothing: state "No changes needed" explicitly -->

# Related
- [[{feat}]]   <- omit if cross-feature; link project hub instead
```

---

### Session  `ses-YYYY-MM-DD-{description}.md`

```markdown
# What I Did
# Problems I Hit
# Decisions Made
# What I Chose NOT To Do — and Why
# Next Steps

# Related
- [[{feat}]]
```

### Bug  `bug-YYYY-MM-DD-{description}.md`

```markdown
# Description
# Steps to Reproduce
# Expected Behavior
# Actual Behavior
# Root Cause
# Fix
  <!-- Use "# Workaround" or "# Proposed Fix" if not yet resolved -->

# Related
- [[{feat}]]
```

### Ticket  `tkt-YYYY-MM-DD-{description}.md`

```markdown
# Request
# Customer Context
# Proposed Solution
# Priority

# Related
- [[{feat}]]
```

### Incident  `inc-YYYY-MM-DD-{description}.md`

```markdown
# Timeline
# Root Cause
# Resolution
# Impact
# Lessons Learned

# Related
- [[{feat}]]
```

### Update  `upd-YYYY-MM-DD-{description}.md`

```markdown
# What Changed
# Why
# Impact

# Related
- [[{feat}]]
- [[{triggered-by}]]   <- the bug/incident/ticket that caused this
```

### Decision  `dec-{name}.md`

```markdown
# Context
# Decision
# Alternatives Considered
# Consequences

# Related
- [[{feat}]]
- [[{prompted-by}]]      <- bug/ticket/incident/session that triggered this decision (omit if initial design)
```

### System  `sys-{name}.md`

```markdown
# {System Title}
### Architecture
### Known Behaviors
### Integration Points

# Related
- [[{project}]]
```

---

## Chain Reaction Rules

When a bug, ticket, or incident is resolved AND the fix changes observable feature behavior:

1. Create an `upd-` record for the feature
2. Set `triggered-by: "[[inc/bug/tkt]]"` on the upd- file
3. Set `spawned: "[[upd-]]"` on the incident/bug/ticket file

This creates a traceable chain in the graph:
```
inc- --spawned--> upd- --triggered-by--> inc-
```

---

## Linking Rules

- Every entity has a `# Related` section at the bottom with wikilinks
- Feature-level entities link to their **feature hub** in Related
- Feature hub links to its **project hub** in Related
- Shared systems link to the **project hub** in Related
- Cross-references to related sessions, bugs, decisions, etc. go in Related
- `triggered-by` and `prompted-by` are YAML fields (not markdown links)
- Use `[[filename-without-extension]]` format for all wikilinks

---

## Dataview Query Templates

Copy-paste ready. Replace `{project}` and `{feat}` with real values.

**Feature Hub sections** — one query block per `## Section` heading:

```text
Sessions:   TABLE date, author FROM "projects/{project}/features/{feat}/sessions" SORT date DESC
Analysis:   TABLE date, author, scope FROM "projects/{project}/features/{feat}/analysis" SORT date DESC
Tickets:    TABLE date, status, customer FROM "projects/{project}/features/{feat}/tickets" SORT date DESC
Updates:    TABLE date, change-type, status FROM "projects/{project}/features/{feat}/updates" SORT date DESC
Bugs:       TABLE date, status, severity FROM "projects/{project}/features/{feat}/bugs" SORT date DESC
Decisions:  TABLE date, status, decision-type FROM "projects/{project}/features/{feat}/decisions" SORT date DESC
Incidents:  TABLE date, status, severity FROM "projects/{project}/features/{feat}/incidents" SORT date DESC
```

**Index Dashboard:**

```text
Open Bugs:      TABLE date, project, feature, severity FROM "" WHERE type = "bug" AND (status = "open" OR status = "in-progress") SORT date DESC
Open Incidents: TABLE date, project, feature FROM "" WHERE type = "incident" AND (status = "open" OR status = "investigating" OR status = "mitigated") SORT date DESC
Open Tickets:   TABLE date, project, feature, customer FROM "" WHERE type = "ticket" AND (status = "open" OR status = "in-progress") SORT date DESC
Recent Work:    TABLE date, project, feature, author FROM "" WHERE type = "session" SORT date DESC LIMIT 10
```

---

## Obsidian Graph Filters

| Query | Shows |
|-------|-------|
| `path:projects/ai-workday` | Everything in one project |
| `property:feature:feat-payment-retry` | One feature and all its entities |
| `property:type:bug` | All bugs across all projects |
| `property:status:open` | All open items |
| `property:severity:critical` | All critical issues |
| `property:author:robin` | Everything one engineer worked on |
| `property:change-type:remove` | All removed features |
| `property:triggered-by` | All updates that were chain-reaction results |
| `property:type:analysis` | All exploratory investigations |
| `property:scope:cross-feature` | Cross-feature analyses only |
| `property:role:info` | All living information files |
| `property:role:hub` | All navigation hub files |