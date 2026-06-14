/**
 * Tracking view — table-based views for bugs, incidents, tickets, updates, sessions.
 * Each table includes project column and uses WorkItem-style IDs.
 */

import { getData } from '../data.js';
import { getCurrentProject } from '../components/navigation.js';
import { sanitize, statusBadge, severityBadge, humanizeId, workItemId } from '../utils.js';
import { openEntityContent } from './entity-content.js';

/**
 * Renders a tracking table for the given entity type.
 */
export function renderTrackingTable(viewId, type) {
  const data = getData();
  if (!data) return;

  const container = document.getElementById(`view-${viewId}`);
  const project = getCurrentProject();

  let items = data.entities
    .filter(e => e.yaml.type === type)
    .sort((a, b) => (b.yaml.date || '').localeCompare(a.yaml.date || ''));

  // Apply project scope
  if (project) {
    items = items.filter(e => e.yaml.project === project);
  }

  const renderers = {
    ticket: renderTicketTable,
    update: renderUpdateTable,
    session: renderSessionTable
  };

  const renderer = renderers[type] || renderDefaultTable;
  container.innerHTML = renderer(items, type);

  // Attach click handlers
  container.querySelectorAll('tr[data-id]').forEach(row => {
    row.addEventListener('click', () => openEntityContent(row.dataset.id));
  });
}

function renderDefaultTable(items, type) {
  return `<div class="table-responsive">
    <table class="table table-hover align-middle">
      <thead><tr>
        <th>Work Item</th><th>Title</th><th>Project</th><th>Feature</th><th>Severity</th><th>Status</th><th>Date</th>
      </tr></thead>
      <tbody>
        ${items.map(e => `
          <tr data-id="${e.id}" role="button">
            <td><span class="entity-id">${workItemId(e.yaml.type, e.numericId)}</span></td>
            <td class="fw-medium">${sanitize(e.yaml.title || humanizeId(e.id))}</td>
            <td><span class="project-tag">${sanitize(e.yaml.project || '')}</span></td>
            <td><code class="text-muted small">${e.yaml.feature || ''}</code></td>
            <td>${severityBadge(e.yaml.severity)}</td>
            <td>${statusBadge(e.yaml.status)}</td>
            <td class="text-muted small font-monospace">${e.yaml.date || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>`;
}

function renderTicketTable(items) {
  return `<div class="table-responsive">
    <table class="table table-hover align-middle">
      <thead><tr>
        <th>Work Item</th><th>Title</th><th>Project</th><th>Customer</th><th>Status</th><th>Date</th>
      </tr></thead>
      <tbody>
        ${items.map(e => `
          <tr data-id="${e.id}" role="button">
            <td><span class="entity-id">${workItemId('ticket', e.numericId)}</span></td>
            <td class="fw-medium">${sanitize(e.yaml.title || humanizeId(e.id))}</td>
            <td><span class="project-tag">${sanitize(e.yaml.project || '')}</span></td>
            <td>${sanitize(e.yaml.customer || '')}</td>
            <td>${statusBadge(e.yaml.status)}</td>
            <td class="text-muted small font-monospace">${e.yaml.date || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>`;
}

function renderUpdateTable(items) {
  return `<div class="table-responsive">
    <table class="table table-hover align-middle">
      <thead><tr>
        <th>Work Item</th><th>Title</th><th>Project</th><th>Change Type</th><th>Status</th><th>Date</th>
      </tr></thead>
      <tbody>
        ${items.map(e => `
          <tr data-id="${e.id}" role="button">
            <td><span class="entity-id">${workItemId('update', e.numericId)}</span></td>
            <td class="fw-medium">${sanitize(e.yaml.title || humanizeId(e.id))}</td>
            <td><span class="project-tag">${sanitize(e.yaml.project || '')}</span></td>
            <td><span class="badge bg-secondary bg-opacity-25 text-light">${sanitize(e.yaml['change-type'] || '')}</span></td>
            <td>${statusBadge(e.yaml.status)}</td>
            <td class="text-muted small font-monospace">${e.yaml.date || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>`;
}

function renderSessionTable(items) {
  return `<div class="table-responsive">
    <table class="table table-hover align-middle">
      <thead><tr>
        <th>Work Item</th><th>Title</th><th>Project</th><th>Feature</th><th>Status</th><th>Date</th>
      </tr></thead>
      <tbody>
        ${items.map(e => `
          <tr data-id="${e.id}" role="button">
            <td><span class="entity-id">${workItemId('session', e.numericId)}</span></td>
            <td class="fw-medium">${sanitize(e.yaml.title || humanizeId(e.id))}</td>
            <td><span class="project-tag">${sanitize(e.yaml.project || '')}</span></td>
            <td><code class="text-muted small">${e.yaml.feature || ''}</code></td>
            <td>${statusBadge(e.yaml.status)}</td>
            <td class="text-muted small font-monospace">${e.yaml.date || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>`;
}
