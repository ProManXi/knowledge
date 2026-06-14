/**
 * Daily Summary view — shows a rich description of work done on the previous day.
 * Groups by project/feature, shows full session details with sections and connections.
 */

import { getData } from '../data.js';
import { getCurrentProject } from '../components/navigation.js';
import { sanitize, statusBadge, severityBadge, workItemId, getTypeIcon } from '../utils.js';
import { openEntityContent } from './entity-content.js';

/** Renders the daily summary for yesterday's work. */
export function renderDailySummary() {
  const data = getData();
  if (!data) return;

  const container = document.getElementById('daily-summary-content');
  const project = getCurrentProject();

  // Filter entities by project
  let allEntities = data.entities;
  if (project) {
    allEntities = allEntities.filter(e => e.yaml.project === project);
  }

  // Find yesterday's date (or most recent date with activity)
  const dates = [...new Set(allEntities.filter(e => e.yaml.date).map(e => e.yaml.date))].sort((a, b) => b.localeCompare(a));

  if (dates.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="bi bi-journal-x" style="font-size:3rem;opacity:0.3"></i><p class="mt-2">No sessions found</p></div>`;
    return;
  }

  // Get yesterday or most recent day
  const today = new Date().toISOString().split('T')[0];
  const targetDate = dates.find(d => d < today) || dates[0];

  // Get all entities from that day
  const dayEntities = allEntities.filter(e => e.yaml.date === targetDate);

  // Group by project
  const byProject = {};
  dayEntities.forEach(e => {
    const proj = e.yaml.project || 'Unassigned';
    if (!byProject[proj]) byProject[proj] = [];
    byProject[proj].push(e);
  });

  // Date navigation
  const dateIdx = dates.indexOf(targetDate);
  const prevDate = dates[dateIdx + 1] || null;
  const nextDate = dateIdx > 0 ? dates[dateIdx - 1] : null;

  container.innerHTML = `
    <div class="daily-summary">
      <div class="daily-summary-header">
        <div class="daily-date-nav">
          <button class="btn btn-sm btn-outline-secondary" id="ds-prev" ${prevDate ? '' : 'disabled'}>
            <i class="bi bi-chevron-left"></i>
          </button>
          <div class="daily-date-display">
            <i class="bi bi-calendar3"></i>
            <span>${formatDate(targetDate)}</span>
          </div>
          <button class="btn btn-sm btn-outline-secondary" id="ds-next" ${nextDate ? '' : 'disabled'}>
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
        <div class="daily-summary-stats">
          <span class="daily-stat">${dayEntities.length} items</span>
          <span class="daily-stat">${dayEntities.filter(e => e.yaml.type === 'session').length} sessions</span>
          <span class="daily-stat">${Object.keys(byProject).length} projects</span>
        </div>
      </div>

      ${Object.entries(byProject).map(([proj, entities]) => `
        <div class="daily-project-group">
          <div class="daily-project-title">
            <i class="bi bi-folder-fill" style="color:var(--color-project)"></i>
            <span>${sanitize(proj)}</span>
          </div>
          ${entities.map(e => renderEntityCard(e)).join('')}
        </div>
      `).join('')}
    </div>
  `;

  // Date navigation handlers
  if (prevDate) {
    document.getElementById('ds-prev').addEventListener('click', () => renderForDate(prevDate));
  }
  if (nextDate) {
    document.getElementById('ds-next').addEventListener('click', () => renderForDate(nextDate));
  }

  // Click handlers
  container.querySelectorAll('[data-id]').forEach(el => {
    el.addEventListener('click', () => openEntityContent(el.dataset.id));
  });
}

function renderForDate(date) {
  const data = getData();
  const container = document.getElementById('daily-summary-content');
  const project = getCurrentProject();

  let allEntities = data.entities;
  if (project) {
    allEntities = allEntities.filter(e => e.yaml.project === project);
  }

  const dayEntities = allEntities.filter(e => e.yaml.date === date);
  const dates = [...new Set(allEntities.filter(e => e.yaml.date).map(e => e.yaml.date))].sort((a, b) => b.localeCompare(a));

  const byProject = {};
  dayEntities.forEach(e => {
    const proj = e.yaml.project || 'Unassigned';
    if (!byProject[proj]) byProject[proj] = [];
    byProject[proj].push(e);
  });

  const dateIdx = dates.indexOf(date);
  const prevDate = dates[dateIdx + 1] || null;
  const nextDate = dateIdx > 0 ? dates[dateIdx - 1] : null;

  container.innerHTML = `
    <div class="daily-summary">
      <div class="daily-summary-header">
        <div class="daily-date-nav">
          <button class="btn btn-sm btn-outline-secondary" id="ds-prev" ${prevDate ? '' : 'disabled'}>
            <i class="bi bi-chevron-left"></i>
          </button>
          <div class="daily-date-display">
            <i class="bi bi-calendar3"></i>
            <span>${formatDate(date)}</span>
          </div>
          <button class="btn btn-sm btn-outline-secondary" id="ds-next" ${nextDate ? '' : 'disabled'}>
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
        <div class="daily-summary-stats">
          <span class="daily-stat">${dayEntities.length} items</span>
          <span class="daily-stat">${dayEntities.filter(e => e.yaml.type === 'session').length} sessions</span>
          <span class="daily-stat">${Object.keys(byProject).length} projects</span>
        </div>
      </div>

      ${Object.entries(byProject).map(([proj, entities]) => `
        <div class="daily-project-group">
          <div class="daily-project-title">
            <i class="bi bi-folder-fill" style="color:var(--color-project)"></i>
            <span>${sanitize(proj)}</span>
          </div>
          ${entities.map(e => renderEntityCard(e)).join('')}
        </div>
      `).join('')}
    </div>
  `;

  if (prevDate) document.getElementById('ds-prev').addEventListener('click', () => renderForDate(prevDate));
  if (nextDate) document.getElementById('ds-next').addEventListener('click', () => renderForDate(nextDate));
  container.querySelectorAll('[data-id]').forEach(el => {
    el.addEventListener('click', () => openEntityContent(el.dataset.id));
  });
}

function renderEntityCard(entity) {
  const { yaml } = entity;
  const wid = workItemId(yaml.type, entity.numericId);

  // Get a richer description from content/sections
  const summary = entity.content.summary || '';
  const sections = entity.sections || [];

  return `
    <div class="daily-entity-card" data-id="${entity.id}">
      <div class="daily-entity-header">
        <div class="daily-entity-icon ${yaml.type}">
          <i class="${getTypeIcon(yaml.type)}"></i>
        </div>
        <div class="daily-entity-info">
          <div class="daily-entity-title">
            <span class="entity-id">${wid}</span>
            ${sanitize(yaml.title || entity.id)}
          </div>
          <div class="daily-entity-meta">
            <span class="badge bg-secondary bg-opacity-25 text-light">${yaml.type}</span>
            ${yaml.feature ? `<code class="text-muted">${yaml.feature}</code>` : ''}
            ${severityBadge(yaml.severity)}
            ${statusBadge(yaml.status)}
          </div>
        </div>
      </div>
      ${summary ? `<div class="daily-entity-summary">${sanitize(summary)}</div>` : ''}
      ${sections.length > 0 ? `
        <div class="daily-entity-sections">
          ${sections.slice(0, 5).map(s => `<span class="section-pill">${sanitize(s)}</span>`).join('')}
          ${sections.length > 5 ? `<span class="section-pill more">+${sections.length - 5}</span>` : ''}
        </div>
      ` : ''}
      ${entity.links.length > 0 ? `
        <div class="daily-entity-links">
          <i class="bi bi-link-45deg"></i> ${entity.links.length} connection${entity.links.length !== 1 ? 's' : ''}
        </div>
      ` : ''}
    </div>
  `;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}
