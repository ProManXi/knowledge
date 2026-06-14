/**
 * Utility functions shared across all modules.
 */

/** Escapes HTML entities to prevent XSS. */
export function sanitize(str) {
  const el = document.createElement('div');
  el.textContent = str || '';
  return el.innerHTML;
}

/** Returns Bootstrap icon class for a given entity type. */
export function getTypeIcon(type) {
  const icons = {
    session: 'bi-journal-code',
    bug: 'bi-bug-fill',
    incident: 'bi-exclamation-triangle-fill',
    decision: 'bi-signpost-split-fill',
    update: 'bi-arrow-up-circle-fill',
    ticket: 'bi-ticket-detailed-fill',
    feature: 'bi-diamond-fill',
    system: 'bi-gear-fill',
    project: 'bi-folder-fill'
  };
  return icons[type] || 'bi-circle';
}

/** Maps entity types to colors. */
export const TYPE_COLORS = {
  project: '#0dcaf0',
  feature: '#6f42c1',
  info: '#17a2b8',
  session: '#0d6efd',
  bug: '#dc3545',
  incident: '#fd7e14',
  decision: '#6f42c1',
  update: '#198754',
  ticket: '#ffc107',
  system: '#20c997'
};

/** Renders a status badge HTML string. */
export function statusBadge(status) {
  if (!status) return '';
  return `<span class="badge badge-status ${status}">${status}</span>`;
}

/** Renders a severity badge HTML string. */
export function severityBadge(severity) {
  if (!severity) return '';
  return `<span class="badge badge-severity ${severity}">${severity}</span>`;
}

/** Truncates a string. */
export function truncate(str, maxLen = 25) {
  if (!str) return '';
  return str.length > maxLen ? str.substring(0, maxLen) + '…' : str;
}

/** Converts file-id to human-readable title. */
export function humanizeId(id) {
  const cleaned = id.replace(/^[a-z]+-\d{4}-\d{2}-\d{2}-/, '');
  if (cleaned === id) {
    // No date prefix, just clean dashes
    return id.replace(/^(feat|info|sys|dec|ses|bug|inc|tkt|upd)-/, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return cleaned.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/** Generates a WorkItem-style ID like BUG-7, SES-4, TKT-15. */
export function workItemId(type, numericId) {
  const prefixes = {
    bug: 'BUG',
    incident: 'INC',
    session: 'SES',
    decision: 'DEC',
    update: 'UPD',
    ticket: 'TKT',
    feature: 'FEAT',
    system: 'SYS',
    project: 'PROJ'
  };
  const prefix = prefixes[type] || 'ITEM';
  return `${prefix}-${numericId || 0}`;
}
