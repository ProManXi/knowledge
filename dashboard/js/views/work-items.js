/**
 * Work Items view — global filter page with pagination.
 */

import { getData } from '../data.js';
import { sanitize, statusBadge, severityBadge, humanizeId, workItemId } from '../utils.js';
import { openEntityContent } from './entity-content.js';

const PAGE_SIZE = 15;
let currentPage = 1;
let filteredItems = [];
let initialized = false;

/** Initializes the Work Items filters on first load. */
export function initWorkItems() {
  if (initialized) return;
  initialized = true;

  const data = getData();
  if (!data) return;

  populateSelect('wi-project', getUnique(data.entities, 'project'));
  populateSelect('wi-feature', getUnique(data.entities, 'feature'));
  populateSelect('wi-type', getUnique(data.entities, 'type'));
  populateSelect('wi-status', getUnique(data.entities, 'status'));

  ['wi-project', 'wi-feature', 'wi-type', 'wi-status', 'wi-from', 'wi-to'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => { currentPage = 1; renderResults(); });
  });
}

/** Renders the Work Items view. */
export function renderWorkItems() {
  initWorkItems();
  renderResults();
}

function renderResults() {
  const data = getData();
  if (!data) return;

  const project = val('wi-project');
  const feature = val('wi-feature');
  const type = val('wi-type');
  const status = val('wi-status');
  const from = val('wi-from');
  const to = val('wi-to');

  filteredItems = data.entities.slice();

  if (project) filteredItems = filteredItems.filter(e => e.yaml.project === project);
  if (feature) filteredItems = filteredItems.filter(e => e.yaml.feature === feature);
  if (type) filteredItems = filteredItems.filter(e => e.yaml.type === type);
  if (status) filteredItems = filteredItems.filter(e => e.yaml.status === status);
  if (from) filteredItems = filteredItems.filter(e => e.yaml.date && e.yaml.date >= from);
  if (to) filteredItems = filteredItems.filter(e => e.yaml.date && e.yaml.date <= to);

  filteredItems.sort((a, b) => (b.yaml.date || '').localeCompare(a.yaml.date || ''));

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredItems.slice(start, start + PAGE_SIZE);

  const container = document.getElementById('wi-results');

  if (filteredItems.length === 0) {
    container.innerHTML = `<div class="text-muted text-center py-5"><i class="bi bi-inbox" style="font-size:2rem;opacity:0.3"></i><p class="mt-2">No items match the current filters</p></div>`;
    document.getElementById('wi-pagination').innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <thead><tr><th>Work Item</th><th>Type</th><th>Title</th><th>Project</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          ${pageItems.map(e => `
            <tr data-id="${e.id}" role="button">
              <td><span class="entity-id">${workItemId(e)}</span></td>
              <td><span class="badge bg-secondary bg-opacity-25 text-light">${e.yaml.type}</span></td>
              <td class="fw-medium">${sanitize(e.yaml.title || humanizeId(e.id))}</td>
              <td><span class="project-tag">${sanitize(e.yaml.project || '')}</span></td>
              <td>${statusBadge(e.yaml.status)}</td>
              <td class="text-muted small font-monospace">${e.yaml.date || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Pagination
  document.getElementById('wi-pagination').innerHTML = `
    <span class="text-muted small">${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''} · Page ${currentPage} of ${totalPages}</span>
    <div class="btn-group btn-group-sm">
      <button class="btn btn-outline-secondary" id="wi-prev" ${currentPage <= 1 ? 'disabled' : ''}>
        <i class="bi bi-chevron-left"></i> Prev
      </button>
      <button class="btn btn-outline-secondary" id="wi-next" ${currentPage >= totalPages ? 'disabled' : ''}>
        Next <i class="bi bi-chevron-right"></i>
      </button>
    </div>
  `;

  // Pagination handlers
  document.getElementById('wi-prev')?.addEventListener('click', () => { currentPage--; renderResults(); });
  document.getElementById('wi-next')?.addEventListener('click', () => { currentPage++; renderResults(); });

  // Row click handlers
  container.querySelectorAll('tr[data-id]').forEach(row => {
    row.addEventListener('click', () => openEntityContent(row.dataset.id));
  });
}

function getUnique(entities, field) {
  const set = new Set();
  entities.forEach(e => { if (e.yaml[field]) set.add(e.yaml[field]); });
  return [...set].sort();
}

function populateSelect(id, options) {
  const el = document.getElementById(id);
  el.innerHTML = `<option value="">All</option>` + options.map(o => `<option value="${o}">${o}</option>`).join('');
}

function val(id) {
  return document.getElementById(id).value;
}
