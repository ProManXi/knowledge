/**
 * Navigation component — sidebar routing and project-scoped navigation.
 */

import { openFeatureContent } from '../views/feature-content.js';

let _currentView = 'overview';
let _currentProject = null;
let _onNavigate = null;

const VIEW_TITLES = {
  overview: 'Overview',
  timeline: 'Timeline',
  graph: 'Connections',
  'work-items': 'Work Items',
  'daily-summary': 'Daily Summary',
  tags: 'Tags',
  'post-mortem': 'Post-Mortem Analysis',
  'knowledge-gaps': 'Knowledge Gaps',
  'impact-radar': 'Impact Radar',
  'feature-content': 'Feature',
  'entity-content': 'Document',
  bugs: 'Bug Tracking',
  incidents: 'Incident Tracking',
  tickets: 'Ticket Tracking',
  updates: 'Updates',
  sessions: 'Sessions'
};

/** Initializes navigation click handlers. */
export function initNavigation(onNavigate) {
  _onNavigate = onNavigate;

  document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', () => {
      switchView(item.dataset.view);
    });
  });
}

/** Programmatically switches to a view. */
export function switchView(viewName) {
  _currentView = viewName;

  // Update sidebar active
  document.querySelectorAll('.nav-item[data-view]').forEach(n => n.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[data-view="${viewName}"]`);
  if (activeNav) activeNav.classList.add('active');

  // Update view visibility
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const activeView = document.getElementById(`view-${viewName}`);
  if (activeView) activeView.classList.add('active');

  // Update header
  document.getElementById('page-title').textContent = VIEW_TITLES[viewName] || viewName;

  // Notify app
  if (_onNavigate) _onNavigate(viewName);
}

/** Returns current view name. */
export function getCurrentView() {
  return _currentView;
}

/** Returns current project filter (or null for all). */
export function getCurrentProject() {
  return _currentProject;
}

/** Sets the current project context and syncs the dropdown. */
export function setCurrentProject(projectId) {
  _currentProject = projectId;
  // Sync the global project dropdown
  const select = document.getElementById('global-project-select');
  if (select && select.value !== (projectId || '')) {
    select.value = projectId || '';
  }
}

/** Renders the projects tree in the sidebar. */
export function renderProjectsNav(trees) {
  const container = document.getElementById('nav-projects');
  if (!container || !trees) return;

  container.innerHTML = Object.values(trees).map(project => `
    <div class="nav-project collapsed">
      <div class="nav-project-header" data-project="${project.id}">
        <i class="bi bi-folder-fill"></i>
        <span>${project.name}</span>
        <i class="bi bi-chevron-down nav-expand"></i>
      </div>
      <div class="nav-project-features">
        ${project.children.map(feat => `
          <div class="nav-feature-item" data-feature="${feat.id}">
            <i class="bi bi-diamond"></i>
            <span>${feat.name}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  // Toggle expand/collapse
  container.querySelectorAll('.nav-project-header').forEach(el => {
    el.addEventListener('click', () => {
      const project = el.parentElement;
      project.classList.toggle('collapsed');

      // Set project context when expanding
      if (!project.classList.contains('collapsed')) {
        setCurrentProject(el.dataset.project);
      }
    });
  });

  // Click feature → open feature content in main body
  container.querySelectorAll('.nav-feature-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openFeatureContent(el.dataset.feature);
    });
  });
}
