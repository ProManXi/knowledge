/**
 * Skills view — shows reusable operational patterns extracted from sessions.
 * Grouped by category, filterable by feature via the project dropdown.
 */

import { getData } from '../data.js';
import { getCurrentProject } from '../components/navigation.js';
import { sanitize, statusBadge, humanizeId } from '../utils.js';
import { openEntityContent } from './entity-content.js';

const CATEGORY_ICONS = {
  architecture: 'bi-diagram-3',
  patterns: 'bi-puzzle',
  testing: 'bi-check2-circle',
  performance: 'bi-speedometer2',
  security: 'bi-shield-lock',
  gotchas: 'bi-exclamation-triangle',
  'data-model': 'bi-database',
  uncategorized: 'bi-lightbulb',
};

export function renderSkills() {
  const container = document.getElementById('view-skills');
  const data = getData();
  if (!container || !data) return;

  const project = getCurrentProject();

  let skills = data.entities.filter(e => e.yaml && e.yaml.type === 'skill');
  if (project) {
    skills = skills.filter(e => e.yaml.project === project);
  }

  // Update badge count
  const badge = document.getElementById('skill-count');
  if (badge) badge.textContent = skills.length;

  if (!skills.length) {
    container.innerHTML = `
      <div class="p-4 text-muted">
        <i class="bi bi-lightbulb me-2"></i>No skills captured yet.
        Skills are extracted automatically during <code>update-session</code> when reusable
        patterns, gotchas, or architectural rules are discovered.
      </div>`;
    return;
  }

  // Group by category
  const byCategory = {};
  for (const s of skills) {
    const cat = (s.yaml.category || 'uncategorized').toLowerCase();
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(s);
  }

  // Sort categories with gotchas first (highest signal), then alphabetical
  const ORDER = ['gotchas', 'architecture', 'security', 'patterns', 'testing', 'performance', 'data-model'];
  const sortedCategories = Object.keys(byCategory).sort((a, b) => {
    const ia = ORDER.indexOf(a);
    const ib = ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  container.innerHTML = `
    <div class="skills-view p-3">
      <div class="d-flex align-items-center mb-3 gap-2">
        <i class="bi bi-lightbulb-fill text-warning fs-5"></i>
        <h5 class="mb-0">Skills</h5>
        <span class="text-muted small">${skills.length} captured${project ? '' : ' across all projects'}</span>
      </div>
      ${sortedCategories.map(cat => renderCategorySection(cat, byCategory[cat])).join('')}
    </div>`;

  container.querySelectorAll('[data-id]').forEach(el => {
    el.addEventListener('click', () => openEntityContent(el.dataset.id));
  });
}

function renderCategorySection(category, skills) {
  const icon = CATEGORY_ICONS[category] || CATEGORY_ICONS.uncategorized;
  const label = category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return `
    <div class="mb-4">
      <div class="d-flex align-items-center gap-2 mb-2">
        <i class="bi ${icon} text-warning"></i>
        <span class="text-uppercase text-muted small fw-semibold">${sanitize(label)}</span>
        <span class="badge bg-secondary bg-opacity-50">${skills.length}</span>
      </div>
      ${skills.map(s => renderSkillCard(s)).join('')}
    </div>`;
}

function renderSkillCard(skill) {
  const features = (skill.yaml.features || []);
  const featureBadges = features.map(f =>
    `<span class="badge bg-secondary bg-opacity-50 me-1">${sanitize(f)}</span>`
  ).join('');

  const derivedFrom = skill.yaml['derived-from']
    ? `<span class="text-muted small ms-2"><i class="bi bi-link-45deg"></i>${sanitize(skill.yaml['derived-from'])}</span>`
    : '';

  return `
    <div class="activity-item" data-id="${sanitize(skill.id)}" style="cursor:pointer" title="Click to view full skill">
      <div class="d-flex justify-content-between align-items-start">
        <div class="flex-grow-1 me-3">
          <div class="fw-semibold">${sanitize(skill.yaml.title || humanizeId(skill.id))}</div>
          ${skill.content && skill.content.summary
            ? `<div class="text-muted small mt-1">${sanitize(skill.content.summary)}</div>`
            : ''}
          <div class="mt-1">${featureBadges}${derivedFrom}</div>
        </div>
        <div class="text-end flex-shrink-0">
          ${statusBadge(skill.yaml.status)}
          <div class="text-muted small mt-1">${sanitize(skill.yaml.date || '')}</div>
        </div>
      </div>
    </div>`;
}
