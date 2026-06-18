/**
 * Feature Content view — shows all entities belonging to a feature.
 * Card-based layout grouped by type with visual indicators.
 */

import { getData } from '../data.js';
import { sanitize, getTypeIcon, statusBadge, severityBadge, workItemId, TYPE_COLORS } from '../utils.js';
import { switchView } from '../components/navigation.js';
import { openEntityContent } from './entity-content.js';

/** Opens feature content showing all its child entities. */
export function openFeatureContent(featureId) {
  const data = getData();
  if (!data) return;

  const container = document.getElementById('feature-content-body');

  // Find the feature hub entity
  const featureHub = data.entities.find(e => e.id === featureId);
  // Find all entities under this feature (excluding the hub itself)
  const children = data.entities.filter(e => e.yaml.feature === featureId && e.id !== featureId);

  const featureName = featureHub
    ? (featureHub.yaml.title || featureHub.yaml.name || featureId)
    : featureId;

  // Group children by type
  const grouped = {};
  for (const child of children) {
    const type = child.yaml.type || 'other';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(child);
  }

  // Order
  const typeOrder = ['feature', 'session', 'bug', 'incident', 'ticket', 'update', 'decision', 'system'];
  const sortedTypes = Object.keys(grouped).sort((a, b) => {
    const ai = typeOrder.indexOf(a);
    const bi = typeOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // Quick stats
  const openBugs = (grouped.bug || []).filter(b => b.yaml.status === 'open' || b.yaml.status === 'in-progress').length;
  const openIncidents = (grouped.incident || []).filter(i => ['open', 'investigating', 'mitigated'].includes(i.yaml.status)).length;
  const totalSessions = (grouped.session || []).length;

  container.innerHTML = `
    <div class="feature-view">
      <div class="feature-view-header">
        <span class="feature-view-icon"><i class="bi-diamond-fill"></i></span>
        <div class="feature-view-header-info">
          <h2 class="feature-view-title">${sanitize(featureName)}</h2>
          <div class="feature-view-meta">
            ${featureHub ? statusBadge(featureHub.yaml.status) : ''}
            <span class="feature-view-count">${children.length} items</span>
          </div>
        </div>
      </div>

      <div class="feature-stats-row">
        ${openBugs > 0 ? `<div class="feature-mini-stat bug"><i class="bi bi-bug-fill"></i> ${openBugs} open bug${openBugs > 1 ? 's' : ''}</div>` : ''}
        ${openIncidents > 0 ? `<div class="feature-mini-stat incident"><i class="bi bi-exclamation-triangle-fill"></i> ${openIncidents} open incident${openIncidents > 1 ? 's' : ''}</div>` : ''}
        ${totalSessions > 0 ? `<div class="feature-mini-stat session"><i class="bi bi-journal-code"></i> ${totalSessions} session${totalSessions > 1 ? 's' : ''}</div>` : ''}
      </div>

      ${sortedTypes.map(type => `
        <div class="feature-type-section">
          <div class="feature-type-header">
            <span class="feature-type-icon" style="color:${TYPE_COLORS[type] || '#a29bfe'}"><i class="${getTypeIcon(type)}"></i></span>
            <span class="feature-type-name">${type.charAt(0).toUpperCase() + type.slice(1)}s</span>
            <span class="feature-type-count">${grouped[type].length}</span>
          </div>
          <div class="feature-cards-grid">
            ${grouped[type].map(item => renderFeatureCard(item)).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Attach click handlers
  container.querySelectorAll('.feature-card[data-id]').forEach(el => {
    el.addEventListener('click', () => openEntityContent(el.dataset.id));
  });

  switchView('feature-content');
}

function renderFeatureCard(item) {
  const { yaml } = item;
  const typeColor = TYPE_COLORS[yaml.type] || '#a29bfe';
  const summary = item.content && item.content.summary ? item.content.summary : '';

  return `
    <div class="feature-card" data-id="${item.id}" style="--card-accent:${typeColor}">
      <div class="feature-card-top">
        <span class="feature-card-id">${workItemId(item)}</span>
        ${yaml.severity ? severityBadge(yaml.severity) : ''}
      </div>
      <div class="feature-card-title">${sanitize(yaml.title || item.id)}</div>
      ${summary ? `<div class="feature-card-desc">${sanitize(summary.length > 120 ? summary.slice(0, 117) + '...' : summary)}</div>` : ''}
      <div class="feature-card-bottom">
        ${statusBadge(yaml.status)}
        ${yaml.date ? `<span class="feature-card-date">${yaml.date}</span>` : ''}
      </div>
      ${item.links.length > 0 ? `<div class="feature-card-links"><i class="bi bi-link-45deg"></i> ${item.links.length}</div>` : ''}
    </div>
  `;
}
