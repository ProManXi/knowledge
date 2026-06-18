/**
 * App entry — initializes the dashboard and routes views.
 */

import { loadData, getData } from './data.js';
import { initNavigation, renderProjectsNav, setCurrentProject, getCurrentView } from './components/navigation.js';
import { renderOverview } from './views/overview.js';
import { renderTimeline } from './views/timeline.js';
import { renderGraph } from './views/graph.js';
import { renderWorkItems } from './views/work-items.js';
import { renderDailySummary } from './views/daily-summary.js';
import { renderTrackingTable } from './views/tracking.js';
import { renderTags } from './views/tags.js';
import { renderPostMortem } from './views/post-mortem.js';
import { renderKnowledgeGaps } from './views/knowledge-gaps.js';
import { renderImpactRadar } from './views/impact-radar.js';
import { renderSkills } from './views/skills.js';
import { renderPRReviews } from './views/pr-reviews.js';
import './views/feature-content.js';
import './views/entity-content.js';

/** View name → render function. */
const VIEW_RENDERERS = {
  'overview': renderOverview,
  'timeline': renderTimeline,
  'graph': renderGraph,
  'work-items': renderWorkItems,
  'daily-summary': renderDailySummary,
  'tags': renderTags,
  'post-mortem': renderPostMortem,
  'knowledge-gaps': renderKnowledgeGaps,
  'impact-radar': renderImpactRadar,
  'bugs': () => renderTrackingTable('bugs', 'bug'),
  'incidents': () => renderTrackingTable('incidents', 'incident'),
  'tickets': () => renderTrackingTable('tickets', 'ticket'),
  'updates': () => renderTrackingTable('updates', 'update'),
  'sessions': () => renderTrackingTable('sessions', 'session'),
  'skills': renderSkills,
  'pr-reviews': renderPRReviews
};

/** Boot the application. */
async function boot() {
  await loadData();
  const data = getData();

  let currentRenderer = null;

  initNavigation((viewName) => {
    const renderer = VIEW_RENDERERS[viewName];
    if (renderer) {
      currentRenderer = renderer;
      renderer();
    }
  });

  // Render sidebar projects
  if (data && data.trees) {
    renderProjectsNav(data.trees);
  }

  // Populate project dropdown
  if (data) {
    const select = document.getElementById('global-project-select');
    const projects = [...new Set(data.entities.map(e => e.yaml.project).filter(Boolean))].sort();
    projects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      select.appendChild(opt);
    });

    // Handle project change
    select.addEventListener('change', () => {
      const value = select.value || null;
      setCurrentProject(value);
      updateBadgeCounts(data, value);
      // Re-render current view
      const view = getCurrentView();
      const renderer = VIEW_RENDERERS[view];
      if (renderer) renderer();
    });
  }

  // Update all badge counts
  if (data) {
    updateBadgeCounts(data, null);
  }

  // Render default view
  renderOverview();
}

function updateBadgeCounts(data, project) {
  let entities = data.entities;
  if (project) {
    entities = entities.filter(e => e.yaml.project === project);
  }

  const counts = {
    'bug-count': entities.filter(e => e.yaml.type === 'bug' && e.yaml.status === 'open').length,
    'incident-count': entities.filter(e => e.yaml.type === 'incident' && ['open', 'investigating', 'mitigated'].includes(e.yaml.status)).length,
    'ticket-count': entities.filter(e => e.yaml.type === 'ticket' && e.yaml.status === 'open').length,
    'update-count': entities.filter(e => e.yaml.type === 'update').length,
    'session-count': entities.filter(e => e.yaml.type === 'session').length,
    'skill-count': entities.filter(e => e.yaml.type === 'skill').length,
    'pr-count': entities.filter(e => e.yaml.type === 'pr-review').length
  };

  Object.entries(counts).forEach(([id, count]) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = count;
      el.style.display = count > 0 ? '' : 'none';
    }
  });
}

boot();
