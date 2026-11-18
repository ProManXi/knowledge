---
type: decision
title: "AI Workflow Strategy — How Parth Uses AI to Deliver"
project: volvo-digital-twin
status: active
author: parth
date: 2026-11-18
tags: [workflow, ai, copilot, claude, strategy]
---

# Context

Parth is new to microservices, Kubernetes, Splunk, JFrog, Azure Pipelines, and Service Bus. The digital twin system is large (10-20+ services). Deadlines are tight. He has two AI tools but they live on different machines with an air gap between them.

# Decision

Use a **two-tool bridge strategy** with the knowledge vault as the connection point.

## Tool Allocation

| Tool | Machine | Best For | Credit Concern |
|------|---------|----------|---------------|
| **Claude (subscription)** | Personal laptop | Understanding, planning, learning concepts, debugging logic, documenting in vault | Unlimited within subscription |
| **GitHub Copilot (30k credits)** | Office laptop | Code completion, inline fixes, "explain this function", small targeted code questions | Credits are finite — use sparingly |

## The Workflow (per ticket/bug/feature)

### Step 1 — Receive (office)
- Read the ticket in Azure DevOps / Jira / wherever
- Copy key details into a plain text note: what's asked, which service, error messages, any Confluence links

### Step 2 — Understand + Plan (personal laptop → Claude)
- Open Claude, describe the problem with context
- Include: service name, error text, relevant log snippets from Splunk, flow description
- Claude gives: explanation of what's likely happening, step-by-step approach, what files to look at, what to ask teammates if info is missing
- **This is free** — use as much as needed

### Step 3 — Execute (office laptop → Copilot)
- Follow Claude's plan
- Use Copilot for:
  - **Inline autocomplete** (almost free — use heavily)
  - **Short targeted questions** about specific code blocks ("what does this method do?")
- **Avoid**: pasting entire files, long open-ended chats, "fix this whole thing" prompts
- If stuck on something Copilot can't answer → note it, bring back to Claude

### Step 4 — Document (personal laptop → Claude + vault)
- Tell Claude what you did and learned
- Claude helps write it into the vault under the correct project/feature
- Use `/update-session` or `/packup` commands
- This builds your reference library over time

## Copilot Credit Conservation Rules

1. **Autocomplete = cheap.** Use it all day for code completion.
2. **Short questions = moderate.** "What does this method return?" is fine.
3. **Explain whole file = expensive.** Only when truly needed.
4. **Long back-and-forth = very expensive.** Don't debug through Copilot chat. Note the problem, bring it to Claude.
5. **Never paste huge files** into Copilot chat.

## When to Ask Teammates vs AI

| Situation | Ask |
|-----------|-----|
| "How does service X connect to service Y?" (not in code/docs) | **Teammate** |
| "Why does this method do X?" (readable in code) | **Copilot** |
| "What is Service Bus and how does it work?" (concept) | **Claude** |
| "Here's an error from Splunk, what does it mean?" | **Claude** |
| "What's the deployment process for this service?" (team-specific) | **Teammate** |
| "How do I write a Splunk query for X?" | **Claude** |
| "This test is failing, here's the error" | **Claude** first (logic), then **Copilot** if code-specific |

## Key Principle

**Claude = think. Copilot = type. Teammates = tribal knowledge.**

Never spend hours stuck. If 20 minutes pass with no progress: escalate to Claude (concept problem) or a teammate (missing context).

# Alternatives Considered

1. **Use only Copilot** — rejected because 30k credits won't survive long debugging sessions across 20+ services
2. **Use only Claude** — rejected because Claude can't see the work codebase
3. **Copy code to Claude** — rejected because work code cannot leave the office laptop

# Consequences

- Parth must maintain discipline: note problems at office, bring to Claude at home
- The vault becomes critical — without it, context is lost between sessions
- Features and bugs get richer documentation over time, reducing repeat questions
- Copilot credits last longer by reserving it for code-level work only

## Evolution
- 2026-11-18 — Strategy established during onboarding conversation.

# Related
- [[volvo-digital-twin]]
