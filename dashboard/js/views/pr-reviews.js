/**
 * PR Reviews view — pull-request reviews captured per project, linked to bugs/features.
 * Grouped by feature, filterable via the project dropdown. Kept out of the Connections graph.
 */

import { getData } from '../data.js';
import { getCurrentProject } from '../components/navigation.js';
import { sanitize, statusBadge, humanizeId } from '../utils.js';
import { openEntityContent } from './entity-content.js';

const KIND_META = {
  bugfix:   { icon: 'bi-bug-fill',        label: 'Bug Fix',  color: '#dc3545' },
  feature:  { icon: 'bi-stars',           label: 'Feature',  color: '#0d6efd' },
  refactor: { icon: 'bi-arrow-repeat',    label: 'Refactor', color: '#6f42c1' },
  chore:    { icon: 'bi-tools',           label: 'Chore',    color: '#6c757d' },
  unknown:  { icon: 'bi-git',             label: 'PR',       color: '#8957e5' },
};

export function renderPRReviews() {
  const container = document.getElementById('view-pr-reviews');
  const data = getData();
  if (!container || !data) return;

  const project = getCurrentProject();

  let prs = data.entities.filter(e => e.yaml && e.yaml.type === 'pr-review');
  if (project) {
    prs = prs.filter(e => e.yaml.project === project);
  }
  prs.sort((a, b) => (b.yaml.date || '').localeCompare(a.yaml.date || ''));

  const badge = document.getElementById('pr-count');
  if (badge) badge.textContent = prs.length;

  if (!prs.length) {
    container.innerHTML = `
      <div class="p-4 text-muted">
        <i class="bi bi-git me-2"></i>No PR reviews captured yet.
        PR reviews are captured during <code>update-session</code> when a pull request has been
        reviewed — each one links to the bug or feature it addresses.
      </div>`;
    return;
  }

  // Group by feature
  const byFeature = {};
  for (const pr of prs) {
    const feat = pr.yaml.feature || 'unassigned';
    if (!byFeature[feat]) byFeature[feat] = [];
    byFeature[feat].push(pr);
  }
  const features = Object.keys(byFeature).sort();

  container.innerHTML = `
    <div class="pr-reviews-view p-3">
      <div class="d-flex align-items-center mb-3 gap-2">
        <i class="bi bi-git fs-5" style="color:#8957e5"></i>
        <h5 class="mb-0">PR Reviews</h5>
        <span class="text-muted small">${prs.length} captured${project ? '' : ' across all projects'}</span>
      </div>
      ${features.map(f => renderFeatureSection(f, byFeature[f])).join('')}
    </div>`;

  container.querySelectorAll('[data-id]').forEach(el => {
    el.addEventListener('click', () => openEntityContent(el.dataset.id));
  });
}

function renderFeatureSection(feature, prs) {
  return `
    <div class="mb-4">
      <div class="d-flex align-items-center gap-2 mb-2">
        <i class="bi bi-diamond" style="color:#8957e5"></i>
        <span class="text-uppercase text-muted small fw-semibold">${sanitize(feature)}</span>
        <span class="badge bg-secondary bg-opacity-50">${prs.length}</span>
      </div>
      ${prs.map(renderPRCard).join('')}
    </div>`;
}

function renderPRCard(pr) {
  const kind = KIND_META[(pr.yaml.kind || 'unknown').toLowerCase()] || KIND_META.unknown;
  const num = pr.yaml['pr-number'] ? `#${sanitize(String(pr.yaml['pr-number']))}` : '';
  const url = pr.yaml['pr-url'];
  const linkedBug = pr.yaml.reviews
    ? `<span class="badge bg-danger bg-opacity-25 text-danger ms-1"><i class="bi bi-bug"></i> ${sanitize(pr.yaml.reviews)}</span>`
    : '';
  const prLink = url
    ? `<a href="${sanitize(url)}" target="_blank" rel="noopener" class="ms-2 small" onclick="event.stopPropagation()"><i class="bi bi-box-arrow-up-right"></i></a>`
    : '';

  return `
    <div class="activity-item" data-id="${sanitize(pr.id)}" style="cursor:pointer" title="Click to view full PR review">
      <div class="d-flex justify-content-between align-items-start">
        <div class="flex-grow-1 me-3">
          <div class="fw-semibold">
            <span class="badge me-2" style="background-color:${kind.color}"><i class="bi ${kind.icon}"></i> ${kind.label}</span>
            ${sanitize(pr.yaml.title || humanizeId(pr.id))}
            ${num ? `<span class="text-muted small ms-2 font-monospace">${num}</span>` : ''}${prLink}
          </div>
          ${pr.content && pr.content.summary
            ? `<div class="text-muted small mt-1">${sanitize(pr.content.summary)}</div>`
            : ''}
          <div class="mt-1">${linkedBug}</div>
        </div>
        <div class="text-end flex-shrink-0">
          ${statusBadge(pr.yaml.status)}
          <div class="text-muted small mt-1">${sanitize(pr.yaml.date || '')}</div>
        </div>
      </div>
    </div>`;
}
