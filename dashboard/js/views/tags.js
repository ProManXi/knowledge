/**
 * Tags view — Tag cloud and tag-filtered entity list.
 * Shows all tags across the vault with counts, allows filtering by tag.
 */

import { getData } from '../data.js';
import { getCurrentProject } from '../components/navigation.js';
import { sanitize, getTypeIcon, statusBadge, severityBadge, workItemId } from '../utils.js';
import { openEntityContent } from './entity-content.js';

export function renderTags() {
  const data = getData();
  if (!data) return;

  const container = document.getElementById('view-tags');
  const project = getCurrentProject();

  let entities = data.entities.filter(e => e.yaml.type !== 'project' && e.yaml.role !== 'hub');
  if (project) {
    entities = entities.filter(e => e.yaml.project === project);
  }

  // Build tag index: tag → [entity IDs]
  const tagIndex = {};
  for (const entity of entities) {
    const tags = entity.yaml.tags;
    if (!Array.isArray(tags)) continue;
    for (const tag of tags) {
      const t = tag.trim().toLowerCase();
      if (!t) continue;
      if (!tagIndex[t]) tagIndex[t] = [];
      tagIndex[t].push(entity.id);
    }
  }

  const sortedTags = Object.entries(tagIndex).sort((a, b) => b[1].length - a[1].length);
  const maxCount = sortedTags.length > 0 ? sortedTags[0][1].length : 1;

  container.innerHTML = `
    <div class="tags-view">
      <div class="tags-cloud-card card">
        <div class="card-header">
          <i class="bi bi-tags-fill text-primary me-2"></i>All Tags
          <span class="text-muted ms-2" style="font-size:0.75rem">${sortedTags.length} tags across ${entities.length} entities</span>
        </div>
        <div class="card-body">
          <div class="tags-cloud">
            ${sortedTags.map(([tag, ids]) => {
              const size = 0.7 + (ids.length / maxCount) * 0.6;
              return `<button class="tag-pill" data-tag="${sanitize(tag)}" style="font-size:${size}rem">
                ${sanitize(tag)} <span class="tag-count">${ids.length}</span>
              </button>`;
            }).join('')}
          </div>
        </div>
      </div>
      <div class="tags-results" id="tags-results">
        <div class="tags-empty-state">
          <i class="bi bi-hand-index"></i>
          <p>Select a tag above to see related entities</p>
        </div>
      </div>
    </div>
  `;

  // Tag click handlers
  container.querySelectorAll('.tag-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      // Toggle active state
      container.querySelectorAll('.tag-pill.active').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const tag = pill.dataset.tag;
      renderTagResults(tag, tagIndex[tag], entities);
    });
  });
}

function renderTagResults(tag, entityIds, allEntities) {
  const resultsContainer = document.getElementById('tags-results');
  const entities = allEntities.filter(e => entityIds.includes(e.id));

  // Group by type
  const grouped = {};
  for (const entity of entities) {
    const type = entity.yaml.type;
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(entity);
  }

  resultsContainer.innerHTML = `
    <div class="tags-results-header">
      <h3><i class="bi bi-tag-fill"></i> ${sanitize(tag)}</h3>
      <span class="text-muted">${entities.length} entities</span>
    </div>
    ${Object.entries(grouped).map(([type, items]) => `
      <div class="tags-type-group">
        <div class="tags-type-label"><i class="${getTypeIcon(type)}"></i> ${type}s (${items.length})</div>
        <div class="tags-entity-list">
          ${items.map(entity => `
            <div class="tags-entity-item" data-id="${entity.id}">
              <div class="tags-entity-main">
                <span class="entity-id-badge small">${workItemId(entity)}</span>
                <span class="tags-entity-title">${sanitize(entity.yaml.title || entity.id)}</span>
              </div>
              <div class="tags-entity-meta">
                ${entity.yaml.severity ? severityBadge(entity.yaml.severity) : ''}
                ${statusBadge(entity.yaml.status)}
                <span class="text-muted" style="font-size:0.7rem">${entity.yaml.feature || ''}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}
  `;

  // Click to open entity
  resultsContainer.querySelectorAll('.tags-entity-item[data-id]').forEach(el => {
    el.addEventListener('click', () => openEntityContent(el.dataset.id));
  });
}
