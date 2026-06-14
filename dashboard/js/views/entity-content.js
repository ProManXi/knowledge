/**
 * Entity Content view — shows full content of a single entity in the main body.
 * Opened when clicking on any document item.
 * Includes full rendered markdown preview.
 */

import { getEntityById } from '../data.js';
import { sanitize, getTypeIcon, statusBadge, severityBadge, workItemId } from '../utils.js';
import { switchView } from '../components/navigation.js';

/** Simple markdown-to-HTML renderer (no external deps). */
function renderMarkdown(md) {
  if (!md) return '';

  // Normalize line endings (Windows \r\n → \n)
  md = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Process block-level elements first
  const lines = md.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    // Mermaid code blocks
    if (lines[i].match(/^```mermaid\s*$/)) {
      const mermaidLines = [];
      i++;
      while (i < lines.length && !lines[i].match(/^```\s*$/)) {
        mermaidLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const mermaidId = 'mermaid-' + Math.random().toString(36).slice(2, 10);
      blocks.push(`<div class="md-mermaid" id="${mermaidId}">${escapeHtml(mermaidLines.join('\n'))}</div>`);
      continue;
    }

    // Other code blocks
    if (lines[i].match(/^```(\w*)\s*$/)) {
      const lang = lines[i].match(/^```(\w*)\s*$/)[1] || 'text';
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].match(/^```\s*$/)) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push(`<pre class="md-code-block"><code class="language-${lang}">${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    // Tables
    if (lines[i].match(/^\|.+\|$/) && i + 1 < lines.length && lines[i + 1].match(/^\|[\s\-:|]+\|$/)) {
      const tableLines = [];
      while (i < lines.length && lines[i].match(/^\|.+\|$/)) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push(renderTable(tableLines));
      continue;
    }

    // Regular lines
    blocks.push(lines[i]);
    i++;
  }

  // Protect block-level HTML (mermaid, tables, code) from inline formatting
  const blockPlaceholders = [];
  const processedBlocks = blocks.map(b => {
    if (b.startsWith('<div class="md-mermaid"') || b.startsWith('<div class="md-table-wrapper"') || b.startsWith('<pre class="md-code"')) {
      blockPlaceholders.push(b);
      return `\x00BLOCK${blockPlaceholders.length - 1}\x00`;
    }
    return b;
  });

  let html = processedBlocks.join('\n');

  // Inline formatting
  html = html
    .replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h5 class="md-h3">$1</h5>')
    .replace(/^## (.+)$/gm, '<h4 class="md-h2">$1</h4>')
    .replace(/^# (.+)$/gm, '<h3 class="md-h1">$1</h3>')
    .replace(/\[\[([^\]]+)\]\]/g, '<span class="md-wikilink" data-link="$1">$1</span>')
    .replace(/^- (.+)$/gm, '<li class="md-li">$1</li>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="md-li md-ol">$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>')
    .replace(/^---$/gm, '<hr class="md-hr">')
    .replace(/\n\n/g, '</p><p class="md-p">')
    .replace(/\n/g, '<br>');

  // Wrap consecutive <li> in <ul>/<ol>
  html = html.replace(/((?:<li class="md-li">.*?<\/li>\s*)+)/g, '<ul class="md-ul">$1</ul>');
  html = html.replace(/((?:<li class="md-li md-ol">.*?<\/li>\s*)+)/g, '<ol class="md-ol-list">$1</ol>');

  // Restore block-level HTML
  html = html.replace(/\x00BLOCK(\d+)\x00/g, (_, idx) => blockPlaceholders[parseInt(idx)]);

  return html;
}

/** Renders a markdown table to HTML. */
function renderTable(tableLines) {
  if (tableLines.length < 2) return tableLines.join('\n');

  const parseRow = (line) => line.split('|').slice(1, -1).map(cell => cell.trim());
  const headers = parseRow(tableLines[0]);
  // Skip separator row (index 1)
  const rows = tableLines.slice(2).map(parseRow);

  let html = '<div class="md-table-wrapper"><table class="md-table"><thead><tr>';
  headers.forEach(h => { html += `<th>${h}</th>`; });
  html += '</tr></thead><tbody>';
  rows.forEach(row => {
    html += '<tr>';
    row.forEach(cell => { html += `<td>${cell}</td>`; });
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  return html;
}

/** Initialize Mermaid diagrams after content is rendered. */
function initMermaid() {
  if (typeof mermaid === 'undefined') return;
  mermaid.initialize({ startOnLoad: false, theme: 'dark', themeVariables: { primaryColor: '#5856D6', primaryTextColor: '#f5f5f7', lineColor: '#636366' } });
  document.querySelectorAll('.md-mermaid').forEach(async (el) => {
    try {
      const { svg } = await mermaid.render(el.id + '-svg', el.innerText.trim());
      el.innerHTML = svg;
      el.classList.add('rendered');
    } catch (e) {
      el.classList.add('mermaid-error');
    }
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Opens entity content in main body area. */
export function openEntityContent(entityId) {
  const entity = getEntityById(entityId);
  if (!entity) return;

  const { yaml } = entity;
  const container = document.getElementById('entity-content-body');

  // Build tags display
  const tagsHtml = Array.isArray(yaml.tags) && yaml.tags.length > 0
    ? `<div class="entity-view-tags">
        ${yaml.tags.map(t => `<span class="entity-tag">${sanitize(t)}</span>`).join('')}
      </div>`
    : '';

  // Build causal chain
  const causalChain = buildCausalChain(entity);

  container.innerHTML = `
    <div class="entity-view">
      <div class="entity-view-header">
        <span class="entity-view-icon ${yaml.type}"><i class="${getTypeIcon(yaml.type)}"></i></span>
        <div class="entity-view-title-block">
          <h2 class="entity-view-title">
            <span class="entity-id-badge">${workItemId(yaml.type, entity.numericId)}</span>
            ${sanitize(yaml.title || yaml.name || entity.id)}
          </h2>
          <div class="entity-view-meta">
            <span class="badge type-badge">${yaml.type}${yaml.role ? ' · ' + yaml.role : ''}</span>
            ${yaml.severity ? severityBadge(yaml.severity) : ''}
            ${statusBadge(yaml.status)}
            ${yaml.date ? `<span class="entity-view-date"><i class="bi-calendar3"></i> ${yaml.date}</span>` : ''}
          </div>
          ${tagsHtml}
        </div>
      </div>

      ${causalChain ? `
        <div class="entity-causal-chain">
          <h3><i class="bi bi-arrow-right-circle"></i> Cause → Effect Chain</h3>
          <div class="causal-flow">
            ${causalChain}
          </div>
        </div>
      ` : ''}

      <div class="entity-view-props">
        <h3>Properties</h3>
        <div class="props-grid">
          ${Object.entries(yaml).filter(([k]) => k !== 'tags').map(([key, value]) => {
            let rendered;
            if (Array.isArray(value)) {
              if (value.length === 0) {
                rendered = '<span class="prop-empty">—</span>';
              } else if (typeof value[0] === 'object' && value[0] !== null) {
                // Array of objects (e.g. files: [{path, role}])
                rendered = `<div class="prop-files">${value.map(obj => {
                  if (obj.path !== undefined) {
                    const roleClass = obj.role ? `file-role-${sanitize(obj.role)}` : '';
                    return `<div class="prop-file-entry"><span class="prop-file-path">${sanitize(obj.path)}</span>${obj.role ? `<span class="prop-file-role ${roleClass}">${sanitize(obj.role)}</span>` : ''}</div>`;
                  }
                  return `<span>${sanitize(JSON.stringify(obj))}</span>`;
                }).join('')}</div>`;
              } else {
                rendered = value.map(v => `<span class="prop-tag">${sanitize(String(v))}</span>`).join('');
              }
            } else {
              rendered = `<span>${sanitize(String(value ?? '—'))}</span>`;
            }
            return `<div class="prop-key">${sanitize(key)}</div><div class="prop-value">${rendered}</div>`;
          }).join('')}
        </div>
      </div>

      ${entity.content.markdown ? `
        <div class="entity-view-markdown">
          <h3><i class="bi bi-file-earmark-text"></i> Full Content</h3>
          <div class="md-rendered">
            ${renderMarkdown(entity.content.markdown)}
          </div>
        </div>
      ` : ''}

      ${entity.links.length > 0 ? `
        <div class="entity-view-links">
          <h3>Connections (${entity.links.length})</h3>
          <div class="entity-links-grid">
            ${entity.links.map(link => {
              const linked = getEntityById(link);
              if (!linked) return `<div class="entity-link-item">${sanitize(link)}</div>`;
              return `<div class="entity-link-item clickable" data-id="${link}">
                <span class="entity-link-icon ${linked.yaml.type}"><i class="${getTypeIcon(linked.yaml.type)}"></i></span>
                <span>${workItemId(linked.yaml.type, linked.numericId)} ${sanitize(linked.yaml.title || linked.yaml.name || link)}</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div class="entity-view-path">
        <span class="path-label">File:</span> ${entity.path}
      </div>
    </div>
  `;

  // Make connection links clickable
  container.querySelectorAll('.entity-link-item.clickable[data-id]').forEach(el => {
    el.addEventListener('click', () => openEntityContent(el.dataset.id));
  });

  // Make wiki-links in markdown clickable
  container.querySelectorAll('.md-wikilink[data-link]').forEach(el => {
    const linked = getEntityById(el.dataset.link);
    if (linked) {
      el.classList.add('clickable');
      el.addEventListener('click', () => openEntityContent(el.dataset.link));
    }
  });

  // Render Mermaid diagrams
  initMermaid();

  // Switch to entity content view
  switchView('entity-content');
}

/** Builds a visual causal chain showing triggered-by / prompted-by / spawned relationships */
function buildCausalChain(entity) {
  const { yaml } = entity;
  const parts = [];

  // Check if this entity was triggered/prompted by something
  const triggeredBy = yaml['triggered-by'];
  const promptedBy = yaml['prompted-by'];
  const spawned = yaml['spawned'];

  if (triggeredBy) {
    const targetId = String(Array.isArray(triggeredBy) ? triggeredBy[0] : triggeredBy).replace(/^\[+/, '').replace(/\]+$/, '');
    const source = getEntityById(targetId);
    if (source) {
      parts.push(`<div class="causal-node clickable" data-id="${targetId}">
        <span class="entity-link-icon ${source.yaml.type}"><i class="${getTypeIcon(source.yaml.type)}"></i></span>
        <span>${workItemId(source.yaml.type, source.numericId)}</span>
        <span class="causal-title">${sanitize(source.yaml.title || targetId)}</span>
      </div>`);
      parts.push(`<div class="causal-arrow"><i class="bi bi-arrow-right"></i><span class="causal-label">triggered</span></div>`);
      parts.push(`<div class="causal-node current">
        <span class="entity-link-icon ${yaml.type}"><i class="${getTypeIcon(yaml.type)}"></i></span>
        <span>${workItemId(yaml.type, entity.numericId)}</span>
        <span class="causal-title">${sanitize(yaml.title || entity.id)}</span>
      </div>`);
    }
  }

  if (promptedBy) {
    const targetId = String(Array.isArray(promptedBy) ? promptedBy[0] : promptedBy).replace(/^\[+/, '').replace(/\]+$/, '');
    const source = getEntityById(targetId);
    if (source) {
      parts.push(`<div class="causal-node clickable" data-id="${targetId}">
        <span class="entity-link-icon ${source.yaml.type}"><i class="${getTypeIcon(source.yaml.type)}"></i></span>
        <span>${workItemId(source.yaml.type, source.numericId)}</span>
        <span class="causal-title">${sanitize(source.yaml.title || targetId)}</span>
      </div>`);
      parts.push(`<div class="causal-arrow"><i class="bi bi-arrow-right"></i><span class="causal-label">prompted</span></div>`);
      parts.push(`<div class="causal-node current">
        <span class="entity-link-icon ${yaml.type}"><i class="${getTypeIcon(yaml.type)}"></i></span>
        <span>${workItemId(yaml.type, entity.numericId)}</span>
        <span class="causal-title">${sanitize(yaml.title || entity.id)}</span>
      </div>`);
    }
  }

  if (spawned) {
    const targetId = String(Array.isArray(spawned) ? spawned[0] : spawned).replace(/^\[+/, '').replace(/\]+$/, '');
    const target = getEntityById(targetId);
    if (target) {
      if (parts.length === 0) {
        parts.push(`<div class="causal-node current">
          <span class="entity-link-icon ${yaml.type}"><i class="${getTypeIcon(yaml.type)}"></i></span>
          <span>${workItemId(yaml.type, entity.numericId)}</span>
          <span class="causal-title">${sanitize(yaml.title || entity.id)}</span>
        </div>`);
      }
      parts.push(`<div class="causal-arrow"><i class="bi bi-arrow-right"></i><span class="causal-label">spawned</span></div>`);
      parts.push(`<div class="causal-node clickable" data-id="${targetId}">
        <span class="entity-link-icon ${target.yaml.type}"><i class="${getTypeIcon(target.yaml.type)}"></i></span>
        <span>${workItemId(target.yaml.type, target.numericId)}</span>
        <span class="causal-title">${sanitize(target.yaml.title || targetId)}</span>
      </div>`);
    }
  }

  if (parts.length === 0) return null;

  return parts.join('');
}
