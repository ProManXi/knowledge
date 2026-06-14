/**
 * Overview view — project-scoped stats, recent activity, open issues.
 */

import { getData } from '../data.js';
import { getCurrentProject } from '../components/navigation.js';
import { sanitize, statusBadge, severityBadge, workItemId } from '../utils.js';
import { openEntityContent } from './entity-content.js';

/** Renders the overview for current project context. */
export function renderOverview() {
  const data = getData();
  if (!data) return;

  const project = getCurrentProject();

  // Filter entities by project if set
  let entities = data.entities;
  let timeline = data.timeline;
  if (project) {
    entities = entities.filter(e => e.yaml.project === project);
    timeline = timeline.filter(t => {
      const entity = data.entities.find(e => e.id === t.id);
      return entity && entity.yaml.project === project;
    });
  }

  renderStats(entities);
  renderRecentActivity(timeline.slice(0, 5));
  renderOpenIssues(entities);
}

function renderStats(entities) {
  const bugs = entities.filter(e => e.yaml.type === 'bug');
  const incidents = entities.filter(e => e.yaml.type === 'incident');
  const sessions = entities.filter(e => e.yaml.type === 'session');
  const updates = entities.filter(e => e.yaml.type === 'update');
  const openBugs = bugs.filter(b => b.yaml.status === 'open').length;
  const openIncidents = incidents.filter(i => ['open', 'investigating', 'mitigated'].includes(i.yaml.status)).length;

  document.getElementById('stats-grid').innerHTML = `
    <div class="col-sm-6 col-xl-3">
      <div class="stat-card bg-danger-subtle">
        <div class="stat-value">${openBugs}</div>
        <div class="stat-label">Open Bugs</div>
        <div class="stat-sub">${bugs.length} total</div>
      </div>
    </div>
    <div class="col-sm-6 col-xl-3">
      <div class="stat-card bg-warning-subtle">
        <div class="stat-value">${openIncidents}</div>
        <div class="stat-label">Open Incidents</div>
        <div class="stat-sub">${incidents.length} total</div>
      </div>
    </div>
    <div class="col-sm-6 col-xl-3">
      <div class="stat-card bg-primary-subtle">
        <div class="stat-value">${sessions.length}</div>
        <div class="stat-label">Sessions</div>
        <div class="stat-sub">Work sessions</div>
      </div>
    </div>
    <div class="col-sm-6 col-xl-3">
      <div class="stat-card bg-success-subtle">
        <div class="stat-value">${updates.length}</div>
        <div class="stat-label">Updates</div>
        <div class="stat-sub">Changes shipped</div>
      </div>
    </div>
  `;
}

function renderRecentActivity(items) {
  const container = document.getElementById('activity-list');

  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state"><p class="text-muted">No activity</p></div>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="activity-item" data-id="${item.id}">
      <div class="activity-icon ${item.type}"><i class="bi ${getBootstrapIcon(item.type)}"></i></div>
      <div class="activity-content">
        <div class="activity-title"><span class="entity-id">${workItemId(item.type, item.numericId)}</span> ${sanitize(item.title)}</div>
        <div class="activity-meta">${item.feature || ''} · ${item.type}</div>
      </div>
      ${statusBadge(item.status)}
      <div class="activity-date">${item.date}</div>
    </div>
  `).join('');

  attachClickHandlers(container);
}

function renderOpenIssues(entities) {
  const openItems = entities.filter(e =>
    ['open', 'in-progress', 'investigating', 'mitigated'].includes(e.yaml.status)
  );
  const container = document.getElementById('open-issues-list');

  if (openItems.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="bi bi-check-circle text-success" style="font-size:2rem"></i><p class="text-muted mt-2">No open issues</p></div>`;
    return;
  }

  container.innerHTML = openItems.map(item => `
    <div class="activity-item" data-id="${item.id}">
      <div class="activity-icon ${item.yaml.type}"><i class="bi ${getBootstrapIcon(item.yaml.type)}"></i></div>
      <div class="activity-content">
        <div class="activity-title"><span class="entity-id">${workItemId(item.yaml.type, item.numericId)}</span> ${sanitize(item.yaml.title || item.id)}</div>
        <div class="activity-meta">${item.yaml.feature || ''}</div>
      </div>
      ${severityBadge(item.yaml.severity)}
      ${statusBadge(item.yaml.status)}
    </div>
  `).join('');

  attachClickHandlers(container);
}

function attachClickHandlers(container) {
  container.querySelectorAll('[data-id]').forEach(el => {
    el.addEventListener('click', () => openEntityContent(el.dataset.id));
  });
}

function getBootstrapIcon(type) {
  const map = {
    bug: 'bi-bug-fill',
    incident: 'bi-exclamation-triangle-fill',
    session: 'bi-journal-code',
    update: 'bi-arrow-up-circle-fill',
    decision: 'bi-signpost-split-fill',
    ticket: 'bi-ticket-detailed-fill',
    feature: 'bi-diamond-fill',
    system: 'bi-gear-fill',
    project: 'bi-folder-fill'
  };
  return map[type] || 'bi-circle';
}
