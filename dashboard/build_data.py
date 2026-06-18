#!/usr/bin/env python3
"""Vault Data Parser (Python port of build-data.js).

Scans the knowledge vault and produces dashboard/data.json — the structured file
that powers the dashboard UI. Stdlib only, no dependencies.

Usage:
  python3 build_data.py            # one-shot build
  python3 build_data.py --watch    # rebuild on change (polls every 1s)

Output shape is identical to the original Node builder so the static UI is unchanged.
"""

import json
import os
import re
import sys
import time
from datetime import datetime, timezone

KIT_DIR = os.path.dirname(os.path.abspath(__file__))
VAULT_ROOT = os.path.dirname(KIT_DIR)
PROJECTS_DIR = os.path.join(VAULT_ROOT, "projects")
OUTPUT_FILE = os.path.join(KIT_DIR, "data.json")


def parse_yaml(content):
    m = re.match(r"^---\r?\n([\s\S]*?)\r?\n---", content)
    if not m:
        return {}
    yaml = {}
    lines = re.split(r"\r?\n", m.group(1))
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]

        # Multi-line list with objects (e.g. files:)
        list_key = re.match(r"^(\S+?):\s*$", line)
        if list_key:
            key = list_key.group(1)
            items = []
            i += 1
            while i < n and (lines[i].startswith("  ") or lines[i].startswith("\t")):
                item_line = lines[i].strip()
                if item_line.startswith("- path:"):
                    obj = {"path": item_line[len("- path:"):].strip()}
                    i += 1
                    while (
                        i < n
                        and re.match(r"^\s+\w+:", lines[i])
                        and not lines[i].strip().startswith("- ")
                    ):
                        prop = re.match(r"^(\w+):\s*(.+)$", lines[i].strip())
                        if prop:
                            obj[prop.group(1)] = prop.group(2).strip()
                        i += 1
                    items.append(obj)
                else:
                    i += 1
            if items:
                yaml[key] = items
            continue

        # Single-line key: value
        sm = re.match(r"^(\S+?):\s+(.+)$", line)
        if sm:
            value = sm.group(2).strip()
            if (value.startswith('"') and value.endswith('"')) or (
                value.startswith("'") and value.endswith("'")
            ):
                value = value[1:-1]
            if value.startswith("[") and value.endswith("]"):
                value = [v.strip() for v in value[1:-1].split(",")]
            else:
                wiki = re.search(r"\[\[([^\]]+)\]\]", value)
                if wiki:
                    value = wiki.group(1)
            yaml[sm.group(1)] = value
        i += 1
    return yaml


def extract_wiki_links(content):
    seen = []
    for m in re.finditer(r"\[\[([^\]|#\r\n]+)\]\]", content):
        link = m.group(1).strip()
        if link not in seen:
            seen.append(link)
    return seen


def extract_sections(content):
    sections = {}
    current = None
    buf = []
    for line in re.split(r"\r?\n", content):
        h = re.match(r"^(#{1,3})\s+(.+)$", line)
        if h:
            if current is not None:
                sections[current] = "\n".join(buf).strip()
            current = h.group(2)
            buf = []
        elif current is not None:
            buf.append(line)
    if current is not None:
        sections[current] = "\n".join(buf).strip()
    return sections


def extract_markdown_body(content):
    return re.sub(r"^---[\s\S]*?---\r?\n", "", content).strip()


def extract_summary(content, yaml):
    sections = extract_sections(content)
    t = yaml.get("type")
    if t == "session" and sections.get("What I Did"):
        lines = [l for l in re.split(r"\r?\n", sections["What I Did"]) if l.strip().startswith("-")]
        return "; ".join(re.sub(r"^-\s*", "", l) for l in lines[:2])[:200]
    if t == "bug" and sections.get("Description"):
        return " ".join(l for l in re.split(r"\r?\n", sections["Description"]) if l.strip())[:200]
    if t == "incident" and sections.get("Description"):
        return " ".join(l for l in re.split(r"\r?\n", sections["Description"]) if l.strip())[:200]
    without_yaml = re.sub(r"^---[\s\S]*?---\r?\n", "", content)
    lines = [
        l
        for l in re.split(r"\r?\n", without_yaml)
        if l.strip() and not l.startswith("#") and not l.startswith("```") and not l.startswith(">")
    ]
    return " ".join(lines[:2])[:200]


TYPE_PREFIX = {
    "bug": "BUG",
    "incident": "INC",
    "session": "SES",
    "decision": "DEC",
    "update": "UPD",
    "ticket": "TKT",
    "pr-review": "PR",
    "feature": "FEAT",
    "system": "SYS",
    "project": "PROJ",
    "analysis": "ANL",
    "skill": "SKL",
}


def work_item_label(yaml, slug):
    """Display label for an entity.

    When the entity carries a real tracker reference (`ref-id`, or `pr-number` for PR reviews),
    show it the way the tracker shows it. Otherwise fall back to a typed date/name label
    (e.g. `SES·2026-06-18`, `DEC·delta-push`) — never a synthetic incrementing number.
    """
    ref = yaml.get("ref-id")
    if ref is None or not str(ref).strip():
        ref = yaml.get("pr-number")
    if ref is not None and str(ref).strip():
        ref = str(ref).strip()
        tracker = (yaml.get("tracker") or "").lower()
        if tracker in ("github", "gitlab") or (not tracker and yaml.get("type") == "pr-review"):
            return ref if ref.startswith("#") else f"#{ref}"
        if tracker == "azure":
            return ref if ref.upper().startswith("AB#") else f"AB#{ref}"
        # jira / linear / unknown: keys are already namespaced (e.g. PROJ-42)
        return ref

    prefix = TYPE_PREFIX.get(yaml.get("type"), "ITEM")
    date = yaml.get("date")
    if isinstance(date, str) and re.match(r"^\d{4}-\d{2}-\d{2}$", date):
        return f"{prefix}·{date}"
    m = re.match(r"^[a-z]+-(\d{4}-\d{2}-\d{2})-", slug)
    if m:
        return f"{prefix}·{m.group(1)}"
    tail = re.sub(r"^(feat|info|sys|dec|skl|anl|upd|tkt|bug|inc|ses|pr)-", "", slug)
    return f"{prefix}·{tail}"


def scan_vault():
    entities = []
    if not os.path.isdir(PROJECTS_DIR):
        return entities
    for root, _dirs, files in os.walk(PROJECTS_DIR):
        for name in files:
            if not name.endswith(".md"):
                continue
            full = os.path.join(root, name)
            with open(full, "r", encoding="utf-8") as fh:
                content = fh.read()
            yaml = parse_yaml(content)
            sections = extract_sections(content)
            rel = os.path.relpath(full, VAULT_ROOT).replace("\\", "/")
            slug = name[:-3]
            entities.append(
                {
                    "id": slug,
                    "workItem": work_item_label(yaml, slug),
                    "filename": name,
                    "path": rel,
                    "folder": os.path.dirname(rel),
                    "yaml": yaml,
                    "links": extract_wiki_links(content),
                    "sections": list(sections.keys()),
                    "sectionContent": sections,
                    "content": {
                        "summary": extract_summary(content, yaml),
                        "markdown": extract_markdown_body(content),
                    },
                }
            )
    return entities


def build_tree_data(entities):
    trees = {}
    projects = [e for e in entities if e["yaml"].get("type") == "project"]
    for project in projects:
        pe = [e for e in entities if e["yaml"].get("project") == project["id"]]
        features = [e for e in pe if e["yaml"].get("role") == "hub" and e["yaml"].get("type") != "project"]
        trees[project["id"]] = {
            "id": project["id"],
            "name": project["yaml"].get("title") or project["yaml"].get("name") or project["id"],
            "type": "project",
            "status": project["yaml"].get("status"),
            "children": [
                {
                    "id": feat["id"],
                    "name": feat["yaml"].get("title") or feat["yaml"].get("name") or feat["id"],
                    "type": "feature",
                    "status": feat["yaml"].get("status"),
                    "children": [
                        {
                            "id": e["id"],
                            "name": e["yaml"].get("title") or e["yaml"].get("name") or e["id"],
                            "type": e["yaml"].get("type"),
                            "role": e["yaml"].get("role"),
                            "status": e["yaml"].get("status"),
                            "severity": e["yaml"].get("severity"),
                            "date": e["yaml"].get("date"),
                            "children": [],
                        }
                        for e in pe
                        if e["yaml"].get("feature") == feat["id"] and e["id"] != feat["id"]
                    ],
                }
                for feat in features
            ],
        }
    return trees


def build_timeline(entities):
    items = [
        {
            "id": e["id"],
            "workItem": e["workItem"],
            "date": e["yaml"].get("date"),
            "type": e["yaml"].get("type"),
            "role": e["yaml"].get("role"),
            "title": e["yaml"].get("title") or e["yaml"].get("name") or e["id"],
            "feature": e["yaml"].get("feature"),
            "status": e["yaml"].get("status"),
            "severity": e["yaml"].get("severity"),
            "tags": e["yaml"].get("tags") or [],
        }
        for e in entities
        if e["yaml"].get("date") and e["yaml"].get("type") != "project" and e["yaml"].get("role") != "hub"
    ]
    items.sort(key=lambda x: x["date"], reverse=True)
    return items


def build_stats(entities):
    def of(t):
        return [e for e in entities if e["yaml"].get("type") == t]

    bugs, incidents, sessions = of("bug"), of("incident"), of("session")
    decisions, updates, tickets = of("decision"), of("update"), of("ticket")
    pr_reviews = of("pr-review")
    return {
        "totalEntities": len(entities),
        "openBugs": len([b for b in bugs if b["yaml"].get("status") in ("open", "in-progress")]),
        "resolvedBugs": len([b for b in bugs if b["yaml"].get("status") == "resolved"]),
        "openIncidents": len([i for i in incidents if i["yaml"].get("status") in ("open", "investigating", "mitigated")]),
        "resolvedIncidents": len([i for i in incidents if i["yaml"].get("status") == "resolved"]),
        "totalSessions": len(sessions),
        "totalDecisions": len(decisions),
        "activeDecisions": len([d for d in decisions if d["yaml"].get("status") == "active"]),
        "totalUpdates": len(updates),
        "totalTickets": len(tickets),
        "openTickets": len([t for t in tickets if t["yaml"].get("status") in ("open", "in-progress")]),
        "totalPRReviews": len(pr_reviews),
        "openPRReviews": len([p for p in pr_reviews if p["yaml"].get("status") in ("open", "changes-requested")]),
        "criticalItems": len([e for e in entities if e["yaml"].get("severity") == "critical"]),
        "highItems": len([e for e in entities if e["yaml"].get("severity") == "high"]),
    }


def build_relationship_graph(entities):
    # PR reviews are intentionally kept OUT of the Connections graph.
    pr_ids = {e["id"] for e in entities if e["yaml"].get("type") == "pr-review"}
    entities = [e for e in entities if e["id"] not in pr_ids]

    nodes = [
        {
            "id": e["id"],
            "workItem": e["workItem"],
            "type": e["yaml"].get("type"),
            "role": e["yaml"].get("role"),
            "title": e["yaml"].get("title") or e["yaml"].get("name") or e["id"],
            "status": e["yaml"].get("status"),
            "feature": e["yaml"].get("feature"),
            "project": e["yaml"].get("project"),
            "severity": e["yaml"].get("severity"),
        }
        for e in entities
    ]
    edges = []
    entity_ids = {e["id"] for e in entities}
    edge_set = set()

    projects = [e for e in entities if e["yaml"].get("type") == "project"]
    features = [e for e in entities if e["yaml"].get("role") == "hub" and e["yaml"].get("type") != "project"]

    for project in projects:
        for feat in [f for f in features if f["yaml"].get("project") == project["id"]]:
            key = f"{project['id']}|{feat['id']}"
            if key not in edge_set:
                edges.append({"source": project["id"], "target": feat["id"], "type": "hierarchy"})
                edge_set.add(key)

    for feat in features:
        for child in [e for e in entities if e["yaml"].get("feature") == feat["id"] and e["id"] != feat["id"]]:
            key = f"{feat['id']}|{child['id']}"
            if key not in edge_set:
                edges.append({"source": feat["id"], "target": child["id"], "type": "hierarchy"})
                edge_set.add(key)

    for sys in [e for e in entities if e["yaml"].get("type") == "system"]:
        project = next((p for p in projects if p["id"] == sys["yaml"].get("project")), None)
        if project:
            key = f"{project['id']}|{sys['id']}"
            if key not in edge_set:
                edges.append({"source": project["id"], "target": sys["id"], "type": "hierarchy"})
                edge_set.add(key)

    for entity in entities:
        for link in entity["links"]:
            if link in entity_ids and link != entity["id"]:
                key = f"{entity['id']}|{link}"
                rkey = f"{link}|{entity['id']}"
                if key not in edge_set and rkey not in edge_set:
                    edges.append({"source": entity["id"], "target": link, "type": "reference"})
                    edge_set.add(key)

    causal_fields = [
        ("triggered-by", "triggered", "incoming"),
        ("prompted-by", "prompted", "incoming"),
        ("spawned", "spawned", "outgoing"),
        ("continues-from", "continues", "incoming"),
        ("continues-in", "continues", "outgoing"),
    ]
    for entity in entities:
        for field, label, direction in causal_fields:
            raw = entity["yaml"].get(field)
            if not raw:
                continue
            if isinstance(raw, list):
                raw = raw[0]
            target_id = re.sub(r"\]+$", "", re.sub(r"^\[+", "", str(raw))).strip()
            if not target_id or target_id not in entity_ids:
                continue
            source = target_id if direction == "incoming" else entity["id"]
            target = entity["id"] if direction == "incoming" else target_id
            key = f"causal:{source}|{target}"
            if key not in edge_set:
                edges.append({"source": source, "target": target, "type": "causal", "label": label})
                edge_set.add(key)

    return {"nodes": nodes, "edges": edges}


def build():
    try:
        entities = scan_vault()
        data = {
            "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.") + f"{datetime.now(timezone.utc).microsecond // 1000:03d}Z",
            "vaultRoot": VAULT_ROOT,
            "stats": build_stats(entities),
            "entities": entities,
            "trees": build_tree_data(entities),
            "timeline": build_timeline(entities),
            "graph": build_relationship_graph(entities),
        }
        with open(OUTPUT_FILE, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2, ensure_ascii=False)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Dashboard data generated: {len(entities)} entities parsed")
    except Exception as err:  # noqa: BLE001 — match JS: report and continue
        print(f"[build error] {err}")


def watch():
    build()
    print(f"Watching {PROJECTS_DIR} for changes...")

    def snapshot():
        s = {}
        for root, _d, files in os.walk(PROJECTS_DIR):
            for f in files:
                if f.endswith(".md"):
                    p = os.path.join(root, f)
                    try:
                        s[p] = os.path.getmtime(p)
                    except OSError:
                        pass
        return s

    prev = snapshot()
    while True:
        time.sleep(1)
        cur = snapshot()
        if cur != prev:
            build()
            prev = cur


if __name__ == "__main__":
    if "--watch" in sys.argv[1:]:
        watch()
    else:
        build()
