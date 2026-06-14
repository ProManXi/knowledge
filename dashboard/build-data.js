/**
 * Vault Data Parser
 * Scans the knowledge vault and produces a structured JSON file
 * that powers the dashboard UI.
 *
 * Usage: node build-data.js
 * Output: data.json in the same directory
 */

const fs = require('fs');
const path = require('path');

const VAULT_ROOT = path.resolve(__dirname, '..');
const PROJECTS_DIR = path.join(VAULT_ROOT, 'projects');
const OUTPUT_FILE = path.join(__dirname, 'data.json');

function parseYaml(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const yaml = {};
  const lines = match[1].split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Multi-line list with objects (files:)
    const listKeyMatch = line.match(/^(\S+?):\s*$/);
    if (listKeyMatch) {
      const key = listKeyMatch[1];
      const items = [];
      i++;
      while (i < lines.length && (lines[i].startsWith('  ') || lines[i].startsWith('\t'))) {
        const itemLine = lines[i].trim();
        if (itemLine.startsWith('- path:')) {
          const obj = { path: itemLine.replace('- path:', '').trim() };
          i++;
          while (i < lines.length && lines[i].match(/^\s+\w+:/) && !lines[i].trim().startsWith('- ')) {
            const propMatch = lines[i].trim().match(/^(\w+):\s*(.+)$/);
            if (propMatch) obj[propMatch[1]] = propMatch[2].trim();
            i++;
          }
          items.push(obj);
        } else {
          i++;
        }
      }
      if (items.length > 0) yaml[key] = items;
      continue;
    }

    // Single-line key: value
    const m = line.match(/^(\S+?):\s+(.+)$/);
    if (m) {
      let value = m[2].trim();
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      // Parse arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim());
      }
      // Parse wiki links in values
      const wikiMatch = value.match && value.match(/\[\[([^\]]+)\]\]/);
      if (wikiMatch) {
        value = wikiMatch[1];
      }
      yaml[m[1]] = value;
    }
    i++;
  }
  return yaml;
}

function extractWikiLinks(content) {
  const links = [];
  const regex = /\[\[([^\]|#\r\n]+)\]\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1].trim());
  }
  return [...new Set(links)];
}

function extractSections(content) {
  const sections = {};
  const lines = content.split(/\r?\n/);
  let currentSection = null;
  let sectionContent = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      if (currentSection) {
        sections[currentSection] = sectionContent.join('\n').trim();
      }
      currentSection = headingMatch[2];
      sectionContent = [];
    } else if (currentSection) {
      sectionContent.push(line);
    }
  }
  if (currentSection) {
    sections[currentSection] = sectionContent.join('\n').trim();
  }
  return sections;
}

function scanVault() {
  const entities = [];

  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        walkDir(fullPath);
      } else if (item.name.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const yaml = parseYaml(content);
        const links = extractWikiLinks(content);
        const sections = extractSections(content);
        const relativePath = path.relative(VAULT_ROOT, fullPath).replace(/\\/g, '/');

        entities.push({
          id: item.name.replace('.md', ''),
          numericId: yaml.id ? parseInt(yaml.id, 10) : null,
          filename: item.name,
          path: relativePath,
          folder: path.dirname(relativePath),
          yaml,
          links,
          sections: Object.keys(sections),
          sectionContent: sections,
          content: {
            summary: extractSummary(content, yaml),
            markdown: extractMarkdownBody(content)
          }
        });
      }
    }
  }

  walkDir(PROJECTS_DIR);
  return entities;
}

function extractMarkdownBody(content) {
  // Strip YAML frontmatter, return the rest as raw markdown
  return content.replace(/^---[\s\S]*?---\r?\n/, '').trim();
}

function extractSummary(content, yaml) {
  // For sessions: prefer first lines from "What I Did" section
  // For bugs: prefer "Description" section
  // Otherwise: first meaningful paragraph
  const sections = extractSections(content);

  if (yaml.type === 'session' && sections['What I Did']) {
    const lines = sections['What I Did'].split(/\r?\n/).filter(l => l.trim().startsWith('-'));
    return lines.slice(0, 2).map(l => l.replace(/^-\s*/, '')).join('; ').substring(0, 200);
  }

  if (yaml.type === 'bug' && sections['Description']) {
    return sections['Description'].split(/\r?\n/).filter(l => l.trim()).slice(0, 2).join(' ').substring(0, 200);
  }

  if (yaml.type === 'incident' && sections['Description']) {
    return sections['Description'].split(/\r?\n/).filter(l => l.trim()).slice(0, 2).join(' ').substring(0, 200);
  }

  // Default: first meaningful paragraph after YAML
  const withoutYaml = content.replace(/^---[\s\S]*?---\r?\n/, '');
  const lines = withoutYaml.split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('```') && !l.startsWith('>'));
  return lines.slice(0, 2).join(' ').substring(0, 200);
}

function buildTreeData(entities) {
  const trees = {};

  // Group by project
  const projects = entities.filter(e => e.yaml.type === 'project');
  for (const project of projects) {
    const projectEntities = entities.filter(e => e.yaml.project === project.id);
    const features = projectEntities.filter(e => e.yaml.role === 'hub' && e.yaml.type !== 'project');

    trees[project.id] = {
      id: project.id,
      name: project.yaml.title || project.yaml.name || project.id,
      type: 'project',
      status: project.yaml.status,
      children: features.map(feat => {
        const featureEntities = projectEntities.filter(e => e.yaml.feature === feat.id && e.id !== feat.id);
        return {
          id: feat.id,
          name: feat.yaml.title || feat.yaml.name || feat.id,
          type: 'feature',
          status: feat.yaml.status,
          children: featureEntities.map(e => ({
            id: e.id,
            name: e.yaml.title || e.yaml.name || e.id,
            type: e.yaml.type,
            role: e.yaml.role,
            status: e.yaml.status,
            severity: e.yaml.severity,
            date: e.yaml.date,
            children: []
          }))
        };
      })
    };
  }

  return trees;
}

function buildTimeline(entities) {
  return entities
    .filter(e => e.yaml.date && e.yaml.type !== 'project' && e.yaml.role !== 'hub')
    .map(e => ({
      id: e.id,
      numericId: e.numericId,
      date: e.yaml.date,
      type: e.yaml.type,
      role: e.yaml.role,
      title: e.yaml.title || e.yaml.name || e.id,
      feature: e.yaml.feature,
      status: e.yaml.status,
      severity: e.yaml.severity,
      tags: e.yaml.tags || []
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function buildStats(entities) {
  const bugs = entities.filter(e => e.yaml.type === 'bug');
  const incidents = entities.filter(e => e.yaml.type === 'incident');
  const sessions = entities.filter(e => e.yaml.type === 'session');
  const decisions = entities.filter(e => e.yaml.type === 'decision');
  const updates = entities.filter(e => e.yaml.type === 'update');
  const tickets = entities.filter(e => e.yaml.type === 'ticket');

  return {
    totalEntities: entities.length,
    openBugs: bugs.filter(b => b.yaml.status === 'open' || b.yaml.status === 'in-progress').length,
    resolvedBugs: bugs.filter(b => b.yaml.status === 'resolved').length,
    openIncidents: incidents.filter(i => ['open', 'investigating', 'mitigated'].includes(i.yaml.status)).length,
    resolvedIncidents: incidents.filter(i => i.yaml.status === 'resolved').length,
    totalSessions: sessions.length,
    totalDecisions: decisions.length,
    activeDecisions: decisions.filter(d => d.yaml.status === 'active').length,
    totalUpdates: updates.length,
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.yaml.status === 'open' || t.yaml.status === 'in-progress').length,
    criticalItems: entities.filter(e => e.yaml.severity === 'critical').length,
    highItems: entities.filter(e => e.yaml.severity === 'high').length
  };
}

function buildRelationshipGraph(entities) {
  const nodes = entities.map(e => ({
    id: e.id,
    numericId: e.numericId,
    type: e.yaml.type,
    role: e.yaml.role,
    title: e.yaml.title || e.yaml.name || e.id,
    status: e.yaml.status,
    feature: e.yaml.feature,
    project: e.yaml.project,
    severity: e.yaml.severity
  }));

  const edges = [];
  const entityIds = new Set(entities.map(e => e.id));
  const edgeSet = new Set(); // Deduplicate edges

  // 1. Hierarchical edges: project → feature hubs
  const projects = entities.filter(e => e.yaml.type === 'project');
  const features = entities.filter(e => e.yaml.role === 'hub' && e.yaml.type !== 'project');

  for (const project of projects) {
    const projectFeatures = features.filter(f => f.yaml.project === project.id);
    for (const feat of projectFeatures) {
      const key = `${project.id}|${feat.id}`;
      if (!edgeSet.has(key)) {
        edges.push({ source: project.id, target: feat.id, type: 'hierarchy' });
        edgeSet.add(key);
      }
    }
  }

  // 2. Hierarchical edges: feature hub → child entities
  for (const feat of features) {
    const children = entities.filter(e => e.yaml.feature === feat.id && e.id !== feat.id);
    for (const child of children) {
      const key = `${feat.id}|${child.id}`;
      if (!edgeSet.has(key)) {
        edges.push({ source: feat.id, target: child.id, type: 'hierarchy' });
        edgeSet.add(key);
      }
    }
  }

  // 2b. Systems connect directly to their project
  const systems = entities.filter(e => e.yaml.type === 'system');
  for (const sys of systems) {
    const project = projects.find(p => p.id === sys.yaml.project);
    if (project) {
      const key = `${project.id}|${sys.id}`;
      if (!edgeSet.has(key)) {
        edges.push({ source: project.id, target: sys.id, type: 'hierarchy' });
        edgeSet.add(key);
      }
    }
  }

  // 3. Wiki-link edges (cross-references)
  for (const entity of entities) {
    for (const link of entity.links) {
      if (entityIds.has(link) && link !== entity.id) {
        const key = `${entity.id}|${link}`;
        const reverseKey = `${link}|${entity.id}`;
        if (!edgeSet.has(key) && !edgeSet.has(reverseKey)) {
          edges.push({ source: entity.id, target: link, type: 'reference' });
          edgeSet.add(key);
        }
      }
    }
  }

  // 4. Causal edges from YAML fields (triggered-by, prompted-by, spawned)
  const causalFields = [
    { field: 'triggered-by', label: 'triggered', direction: 'incoming' },
    { field: 'prompted-by', label: 'prompted', direction: 'incoming' },
    { field: 'spawned', label: 'spawned', direction: 'outgoing' },
    { field: 'continues-from', label: 'continues', direction: 'incoming' },
    { field: 'continues-in', label: 'continues', direction: 'outgoing' }
  ];

  for (const entity of entities) {
    for (const { field, label, direction } of causalFields) {
      let raw = entity.yaml[field];
      if (!raw) continue;

      // Normalize: could be string or array (parser artifact from [[...]] syntax)
      if (Array.isArray(raw)) raw = raw[0];
      // Strip remaining brackets from wiki-link parsing artifacts
      const targetId = String(raw).replace(/^\[+/, '').replace(/\]+$/, '').trim();

      if (!targetId || !entityIds.has(targetId)) continue;

      const source = direction === 'incoming' ? targetId : entity.id;
      const target = direction === 'incoming' ? entity.id : targetId;
      const key = `causal:${source}|${target}`;
      if (!edgeSet.has(key)) {
        edges.push({ source, target, type: 'causal', label });
        edgeSet.add(key);
      }
    }
  }

  return { nodes, edges };
}

// ─── Build ────────────────────────────────────────────────────────────────────

function build() {
  try {
    const entities = scanVault();
    const data = {
      generated: new Date().toISOString(),
      vaultRoot: VAULT_ROOT,
      stats: buildStats(entities),
      entities,
      trees: buildTreeData(entities),
      timeline: buildTimeline(entities),
      graph: buildRelationshipGraph(entities)
    };
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf-8');
    const ts = new Date().toLocaleTimeString();
    console.log(`[${ts}] Dashboard data generated: ${entities.length} entities parsed`);
  } catch (err) {
    console.error(`[build error] ${err.message}`);
  }
}

// ─── Watch ────────────────────────────────────────────────────────────────────

function watch() {
  build();
  console.log(`Watching ${PROJECTS_DIR} for changes...`);

  let debounceTimer = null;

  function onChange(eventType, filename) {
    if (!filename || !filename.endsWith('.md')) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log(`  changed: ${filename}`);
      build();
    }, 200);
  }

  // fs.watch is recursive on Windows/macOS
  fs.watch(PROJECTS_DIR, { recursive: true }, onChange);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

if (process.argv.includes('--watch')) {
  watch();
} else {
  build();
}
