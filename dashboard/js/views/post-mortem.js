/**
 * Incident Post-Mortem view — aggregated analysis of all incidents.
 * Shows: timeline visualization, root cause taxonomy, lessons learned,
 * resolution patterns, and severity distribution.
 */

import { getData } from '../data.js';
import { getCurrentProject } from '../components/navigation.js';
import { sanitize, getTypeIcon, statusBadge, severityBadge, workItemId } from '../utils.js';
import { openEntityContent } from './entity-content.js';

export function renderPostMortem() {
  const data = getData();
  if (!data) return;

  const container = document.getElementById('view-post-mortem');
  const project = getCurrentProject();

  let incidents = data.entities.filter(e => e.yaml.type === 'incident');
  if (project) {
    incidents = incidents.filter(e => e.yaml.project === project);
  }

  // Sort by date descending
  incidents.sort((a, b) => (b.yaml.date || '').localeCompare(a.yaml.date || ''));

  // Extract metrics
  const resolved = incidents.filter(i => i.yaml.status === 'resolved');
  const critical = incidents.filter(i => i.yaml.severity === 'critical');
  const high = incidents.filter(i => i.yaml.severity === 'high');

  // Extract root causes and lessons from section content
  const rootCauses = [];
  const lessons = [];
  const timelines = [];

  for (const inc of incidents) {
    if (inc.sectionContent) {
      if (inc.sectionContent['Root Cause']) {
        rootCauses.push({ entity: inc, text: inc.sectionContent['Root Cause'] });
      }
      if (inc.sectionContent['Lessons Learned']) {
        const items = inc.sectionContent['Lessons Learned']
          .split(/\r?\n/)
          .filter(l => l.trim().startsWith('-'))
          .map(l => l.replace(/^-\s*/, '').trim());
        items.forEach(item => lessons.push({ entity: inc, text: item }));
      }
      if (inc.sectionContent['Timeline']) {
        const events = inc.sectionContent['Timeline']
          .split(/\r?\n/)
          .filter(l => l.trim().startsWith('-'))
          .map(l => {
            const m = l.match(/\*\*(.+?)\*\*\s*[—–-]\s*(.+)/);
            return m ? { time: m[1], event: m[2], entity: inc } : null;
          })
          .filter(Boolean);
        if (events.length > 0) timelines.push({ entity: inc, events });
      }
    }
  }

  // Categorize root causes by keyword patterns
  const categories = categorizeRootCauses(rootCauses);

  container.innerHTML = `
    <div class="postmortem-view">
      <!-- Metrics row -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="stat-card incident">
            <div class="stat-value">${incidents.length}</div>
            <div class="stat-label">Total Incidents</div>
            <div class="stat-sub">${resolved.length} resolved</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card bug">
            <div class="stat-value">${critical.length}</div>
            <div class="stat-label">Critical</div>
            <div class="stat-sub">${high.length} high severity</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card session">
            <div class="stat-value">${rootCauses.length}</div>
            <div class="stat-label">Root Causes Documented</div>
            <div class="stat-sub">${Math.round((rootCauses.length / Math.max(incidents.length, 1)) * 100)}% coverage</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card update">
            <div class="stat-value">${lessons.length}</div>
            <div class="stat-label">Lessons Captured</div>
            <div class="stat-sub">Across all post-mortems</div>
          </div>
        </div>
      </div>

      <!-- Root Cause Taxonomy -->
      <div class="row g-4 mb-4">
        <div class="col-lg-6">
          <div class="card">
            <div class="card-header">
              <i class="bi bi-diagram-3 text-danger me-2"></i>Root Cause Taxonomy
            </div>
            <div class="card-body">
              ${Object.entries(categories).length > 0 ? `
                <div class="taxonomy-grid">
                  ${Object.entries(categories).map(([category, items]) => `
                    <div class="taxonomy-category">
                      <div class="taxonomy-header">
                        <span class="taxonomy-icon">${getCategoryIcon(category)}</span>
                        <span class="taxonomy-name">${sanitize(category)}</span>
                        <span class="taxonomy-count">${items.length}</span>
                      </div>
                      <div class="taxonomy-items">
                        ${items.map(item => `
                          <div class="taxonomy-item" data-id="${item.entity.id}">
                            <span class="taxonomy-item-id">${workItemId(item.entity)}</span>
                            <span class="taxonomy-item-text">${sanitize(item.text.substring(0, 80))}${item.text.length > 80 ? '…' : ''}</span>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : '<p class="text-muted">No root causes documented yet.</p>'}
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card">
            <div class="card-header">
              <i class="bi bi-lightbulb text-warning me-2"></i>Lessons Learned
            </div>
            <div class="card-body">
              ${lessons.length > 0 ? `
                <div class="lessons-list">
                  ${lessons.map(lesson => `
                    <div class="lesson-item" data-id="${lesson.entity.id}">
                      <div class="lesson-text">${sanitize(lesson.text)}</div>
                      <div class="lesson-source">
                        ${severityBadge(lesson.entity.yaml.severity)}
                        <span class="text-muted">${workItemId(lesson.entity)} · ${lesson.entity.yaml.date}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : '<p class="text-muted">No lessons documented yet.</p>'}
            </div>
          </div>
        </div>
      </div>

      <!-- Incident Timeline -->
      <div class="card mb-4">
        <div class="card-header">
          <i class="bi bi-clock-history text-primary me-2"></i>Incident Timelines
        </div>
        <div class="card-body">
          ${timelines.length > 0 ? timelines.map(tl => `
            <div class="pm-timeline-group">
              <div class="pm-timeline-header" data-id="${tl.entity.id}">
                <span class="entity-id-badge small">${workItemId(tl.entity)}</span>
                <strong>${sanitize(tl.entity.yaml.title)}</strong>
                ${severityBadge(tl.entity.yaml.severity)}
                <span class="text-muted ms-auto">${tl.entity.yaml.date}</span>
              </div>
              <div class="pm-timeline-events">
                ${tl.events.map(ev => `
                  <div class="pm-timeline-event">
                    <span class="pm-time">${sanitize(ev.time)}</span>
                    <span class="pm-event-text">${sanitize(ev.event)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('') : '<p class="text-muted">No incident timelines available.</p>'}
        </div>
      </div>

      <!-- All Incidents Table -->
      <div class="card">
        <div class="card-header">
          <i class="bi bi-list-ul text-primary me-2"></i>All Incidents
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Project</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Root Cause</th>
                </tr>
              </thead>
              <tbody>
                ${incidents.map(inc => `
                  <tr class="clickable-row" data-id="${inc.id}" style="cursor:pointer">
                    <td>${workItemId(inc)}</td>
                    <td>${sanitize(inc.yaml.title || inc.id)}</td>
                    <td><span class="project-tag">${inc.yaml.project}</span></td>
                    <td>${severityBadge(inc.yaml.severity)}</td>
                    <td>${statusBadge(inc.yaml.status)}</td>
                    <td>${inc.yaml.date || '—'}</td>
                    <td>${inc.sectionContent && inc.sectionContent['Root Cause'] ? '<i class="bi bi-check-circle text-success"></i>' : '<i class="bi bi-x-circle text-muted"></i>'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  // Click handlers
  container.querySelectorAll('[data-id]').forEach(el => {
    el.addEventListener('click', () => openEntityContent(el.dataset.id));
  });
}

/** Categorize root causes by keyword patterns */
function categorizeRootCauses(rootCauses) {
  const categories = {};
  const patterns = [
    { name: 'Resource Exhaustion', keywords: ['memory', 'cpu', 'disk', 'oom', 'exhaustion', 'limit', 'capacity'] },
    { name: 'Data Integrity', keywords: ['corrupt', 'duplicate', 'inconsist', 'loss', 'orphan', 'stale'] },
    { name: 'Race Condition', keywords: ['race', 'concurrent', 'deadlock', 'lock', 'atomic', 'timing'] },
    { name: 'Configuration', keywords: ['config', 'setting', 'environment', 'flag', 'migration'] },
    { name: 'External Dependency', keywords: ['timeout', 'upstream', 'third-party', 'api', 'network', 'dns'] },
    { name: 'Logic Error', keywords: ['logic', 'calculation', 'boundary', 'overflow', 'edge case', 'validation'] },
    { name: 'Scale / Load', keywords: ['scale', 'load', 'spike', 'traffic', 'throughput', 'bottleneck'] }
  ];

  for (const rc of rootCauses) {
    const text = rc.text.toLowerCase();
    let matched = false;
    for (const { name, keywords } of patterns) {
      if (keywords.some(k => text.includes(k))) {
        if (!categories[name]) categories[name] = [];
        categories[name].push(rc);
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (!categories['Other']) categories['Other'] = [];
      categories['Other'].push(rc);
    }
  }

  return categories;
}

function getCategoryIcon(category) {
  const icons = {
    'Resource Exhaustion': '💥',
    'Data Integrity': '🔗',
    'Race Condition': '⚡',
    'Configuration': '⚙️',
    'External Dependency': '🌐',
    'Logic Error': '🧮',
    'Scale / Load': '📈',
    'Other': '❓'
  };
  return icons[category] || '❓';
}
