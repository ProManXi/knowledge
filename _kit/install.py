#!/usr/bin/env python3
"""Knowledge Kit installer / generator.

  python3 _kit/install.py --global
      Copy the launcher skills into ~/.claude/skills and (re)generate the vault's own
      root CLAUDE.md from INSTRUCTIONS.md. Run once per machine, and again whenever you
      add/rename a skill.

  python3 _kit/install.py --project <path> [--slug <slug>] [--author <name>]
      Connect a code repo to this vault: write <path>/.knowledge.json and generate a rule
      file for every project-scoped tool in tools.json. Generated content is wrapped in
      KNOWLEDGE-KIT markers, so a project's own rules are never clobbered.

  python3 _kit/install.py add-tool <name> --target <path> [--scope project|global] [--channel file|skills]
      Register a new AI tool, then re-run --global / --project to emit its files.

One source of truth: INSTRUCTIONS.md. Edit it, re-run, every tool updates.
"""

import json
import os
import shutil
import sys

KIT_DIR = os.path.dirname(os.path.abspath(__file__))
VAULT_ROOT = os.path.dirname(KIT_DIR)
INSTRUCTIONS = os.path.join(KIT_DIR, "INSTRUCTIONS.md")
TOOLS_FILE = os.path.join(KIT_DIR, "tools.json")
SKILLS_DIR = os.path.join(KIT_DIR, "skills")
MARK_START = "<!-- KNOWLEDGE-KIT:START (generated from _kit/INSTRUCTIONS.md — do not edit by hand) -->"
MARK_END = "<!-- KNOWLEDGE-KIT:END -->"


def load_tools():
    with open(TOOLS_FILE, encoding="utf-8") as fh:
        return json.load(fh)["tools"]


def read_instructions():
    with open(INSTRUCTIONS, encoding="utf-8") as fh:
        return fh.read()


def render_block(header):
    return f"{MARK_START}\n{header}\n\n{read_instructions()}\n{MARK_END}\n"


def write_managed(file, block):
    """Insert block into file, replacing an existing KNOWLEDGE-KIT block if present,
    else appending — preserving any hand-written content (e.g. coding rules)."""
    os.makedirs(os.path.dirname(file) or ".", exist_ok=True)
    existing = ""
    if os.path.exists(file):
        with open(file, encoding="utf-8") as fh:
            existing = fh.read()
    if MARK_START in existing and MARK_END in existing:
        before = existing[: existing.index(MARK_START)]
        after = existing[existing.index(MARK_END) + len(MARK_END):]
        out = before + block.rstrip() + after
    else:
        sep = "\n\n" if existing and not existing.endswith("\n") else ("\n" if existing else "")
        out = existing + sep + block
    with open(file, "w", encoding="utf-8") as fh:
        fh.write(out)


def project_header(slug):
    return (
        f"# Knowledge Kit — {slug}\n"
        "This repository is connected to a central knowledge vault. Read `./.knowledge.json` for "
        "the vault path and project slug, then follow the instructions below. The full rules also "
        "live at `<vault>/_kit/INSTRUCTIONS.md` and `<vault>/_guide.md`. "
        "Commands: **startday**, **update-session**, **packup**."
    )


def cmd_global():
    dest = os.path.expanduser(load_tools()["claude-code"]["target"])
    if os.path.exists(dest):
        # refresh: copy each skill dir, overwriting
        for entry in os.listdir(SKILLS_DIR):
            s = os.path.join(SKILLS_DIR, entry)
            d = os.path.join(dest, entry)
            if os.path.isdir(s):
                shutil.rmtree(d, ignore_errors=True)
                shutil.copytree(s, d)
    else:
        shutil.copytree(SKILLS_DIR, dest)
    print(f"✓ Copied launcher skills → {dest}")

    header = (
        "# Knowledge Vault — root CLAUDE.md\n"
        f"You are working **inside the knowledge vault itself** ({VAULT_ROOT}). Curate it directly.\n"
        "Source of truth for behavior: `_kit/INSTRUCTIONS.md` (this block is generated from it)."
    )
    # The vault's own CLAUDE.md is a fully-generated file (single source) — overwrite it whole.
    root_claude = os.path.join(VAULT_ROOT, "CLAUDE.md")
    with open(root_claude, "w", encoding="utf-8") as fh:
        fh.write(render_block(header))
    print(f"✓ Regenerated {root_claude}")


def cmd_project(target, slug, author):
    if not target:
        sys.exit("Usage: install.py --project <path> [--slug <slug>] [--author <name>]")
    repo = os.path.abspath(os.path.expanduser(target))
    slug = slug or os.path.basename(repo.rstrip("/"))
    author = author or "robin"

    binding = {"vault": VAULT_ROOT, "project": slug, "author": author}
    with open(os.path.join(repo, ".knowledge.json"), "w", encoding="utf-8") as fh:
        fh.write(json.dumps(binding, indent=2) + "\n")
    print(f"✓ Wrote {os.path.join(repo, '.knowledge.json')}  (project: {slug})")

    for name, cfg in load_tools().items():
        if not cfg.get("enabled") or cfg.get("scope") != "project" or cfg.get("channel") != "file":
            continue
        file = os.path.join(repo, cfg["target"])
        write_managed(file, render_block(project_header(slug)))
        print(f"✓ Generated {name:<8} → {file}")


def cmd_add_tool(name, opts):
    if not name or not opts.get("target"):
        sys.exit("Usage: install.py add-tool <name> --target <path> [--scope project|global] [--channel file|skills]")
    with open(TOOLS_FILE, encoding="utf-8") as fh:
        data = json.load(fh)
    data["tools"][name] = {
        "enabled": True,
        "scope": opts.get("scope", "project"),
        "channel": opts.get("channel", "file"),
        "target": opts["target"],
    }
    with open(TOOLS_FILE, "w", encoding="utf-8") as fh:
        fh.write(json.dumps(data, indent=2) + "\n")
    print(f"✓ Registered tool '{name}' → {opts['target']}. Re-run --global/--project to emit its files.")


def parse(argv):
    flags, pos = {}, []
    i = 0
    while i < len(argv):
        a = argv[i]
        if a.startswith("--"):
            key = a[2:]
            nxt = argv[i + 1] if i + 1 < len(argv) else None
            if nxt is None or nxt.startswith("--"):
                flags[key] = True
            else:
                flags[key] = nxt
                i += 1
        else:
            pos.append(a)
        i += 1
    return flags, pos


def main():
    argv = sys.argv[1:]
    if argv and argv[0] == "add-tool":
        flags, pos = parse(argv[1:])
        cmd_add_tool(pos[0] if pos else None, flags)
        return
    flags, pos = parse(argv)
    if flags.get("global"):
        cmd_global()
    elif "project" in flags:
        target = flags["project"] if isinstance(flags["project"], str) else (pos[0] if pos else None)
        cmd_project(target, flags.get("slug"), flags.get("author"))
    else:
        print(
            "Knowledge Kit installer\n"
            "  --global                                                   install skills to ~/.claude + regen vault CLAUDE.md\n"
            "  --project <path> [--slug s] [--author a]                   connect a repo\n"
            "  add-tool <name> --target <path> [--scope] [--channel]      register a tool"
        )


if __name__ == "__main__":
    main()
