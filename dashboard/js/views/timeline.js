/**
 * Timeline view — chronological event stream grouped by date.
 */

import { getData } from '../data.js';
import { getCurrentProject } from '../components/navigation.js';
import { sanitize, statusBadge, severityBadge, workItemId } from '../utils.js';
import { openEntityContent } from './entity-content.js';

/** Renders the timeline view. */
export function renderTimeline() {
  const data = getData();
  if (!data) return;

  let items = data.timeline;
  const project = getCurrentProject();
  if (project) {
    items = items.filter(t => {
      const entity = data.entities.find(e => e.id === t.id);
      return entity && entity.yaml.project === project;
    });
  }

  // Group by date
  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.date]) grouped[item.date] = [];
    grouped[item.date].push(item);
  });

  const container = document.getElementById('timeline-container');
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  container.innerHTML = sortedDates.map(date => `
    <div class="timeline-group">
      <div class="timeline-date">${date}</div>
      <div class="timeline-events">
        ${grouped[date].map(ev => `
          <div class="timeline-event" data-id="${ev.id}">
            <span class="timeline-event-type ${ev.type}">${ev.type}</span>
            <span class="entity-id">${workItemId(ev)}</span>
            <span class="timeline-event-title">${sanitize(ev.title)}</span>
            ${severityBadge(ev.severity)}
            ${statusBadge(ev.status)}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  // Attach click handlers
  container.querySelectorAll('.timeline-event[data-id]').forEach(el => {
    el.addEventListener('click', () => openEntityContent(el.dataset.id));
  });
}
