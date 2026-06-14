/**
 * Knowledge Gaps view — surfaces incomplete documentation and stale knowledge.
 */

import { getData } from '../data.js';

export function renderKnowledgeGaps() {
  const container = document.getElementById('view-knowledge-gaps');
  const data = getData();
  if (!container || !data) return;

  const entities = data.entities || [];
  const gaps = analyzeGaps(entities);

  container.innerHTML = `
    <div class="knowledge-gaps-view">
      <div class="row g-3 mb-4">
        ${renderGapStat('Bugs Without Root Cause', gaps.bugsNoRootCause.length, 'bi-bug', 'var(--color-red)')}
        ${renderGapStat('Stale Open Questions', gaps.staleQuestions.length, 'bi-question-circle', 'var(--color-orange)')}
        ${renderGapStat('Untracked Files', gaps.untrackedFiles.length, 'bi-file-earmark-x', 'var(--color-yellow)')}
        ${renderGapStat('Recurring Defect Sources', gaps.recurringSources.length, 'bi-arrow-repeat', 'var(--color-purple)')}
      </div>

      ${gaps.bugsNoRootCause.length ? renderSection('Bugs Without Identified Root Cause', 'bi-bug-fill', 'These bugs are resolved or open but have no root-cause file tracked. Understanding is incomplete.', renderBugsList(gaps.bugsNoRootCause)) : ''}

      ${gaps.recurringSources.length ? renderSection('Recurring Defect Sources', 'bi-arrow-repeat', 'Files that appear as root-cause in multiple bugs. May need refactoring or test coverage.', renderRecurrenceList(gaps.recurringSources)) : ''}

      ${gaps.staleQuestions.length ? renderSection('Open Questions (Oldest First)', 'bi-question-circle-fill', 'Questions documented in info files that remain unanswered. Knowledge gaps that may block future work.', renderQuestionsList(gaps.staleQuestions)) : ''}

      ${gaps.untrackedFiles.length ? renderSection('Unregistered Files', 'bi-file-earmark-x', 'Files referenced in entity files: YAML but missing from the feature File Map.', renderUntrackedList(gaps.untrackedFiles)) : ''}

      ${gaps.featuresNoRecentUpdate.length ? renderSection('Features With No Recent Activity', 'bi-clock-history', 'Features with no sessions, bugs, or updates in the last 30 days. Knowledge may be stale.', renderStaleFeatures(gaps.featuresNoRecentUpdate)) : ''}

      ${!gaps.bugsNoRootCause.length && !gaps.recurringSources.length && !gaps.staleQuestions.length && !gaps.untrackedFiles.length && !gaps.featuresNoRecentUpdate.length ? '<div class="gaps-empty-state"><i class="bi bi-check-circle-fill"></i><p>No knowledge gaps detected. All features are well-documented.</p></div>' : ''}
    </div>
  `;
}

function analyzeGaps(entities) {
  const bugs = entities.filter(e => e.yaml && e.yaml.type === 'bug');
  const features = entities.filter(e => e.yaml && e.yaml.type === 'feature' && e.yaml.role === 'info');

  // 1. Bugs without root-cause file
  const bugsNoRootCause = bugs.filter(b => {
    const files = b.yaml.files || [];
    return !files.some(f => f.role === 'root-cause');
  });

  // 2. Recurring defect sources
  const rootCauseMap = {};
  bugs.forEach(b => {
    (b.yaml.files || []).forEach(f => {
      if (f.role === 'root-cause') {
        if (!rootCauseMap[f.path]) rootCauseMap[f.path] = [];
        rootCauseMap[f.path].push(b);
      }
    });
  });
  const recurringSources = Object.entries(rootCauseMap)
    .filter(([, bugs]) => bugs.length >= 2)
    .map(([path, bugs]) => ({ path, bugs, count: bugs.length }))
    .sort((a, b) => b.count - a.count);

  // 3. Stale open questions (from info files with Open Questions section)
  const staleQuestions = [];
  features.forEach(f => {
    const sections = f.sectionContent || {};
    const oq = sections['Open Questions'] || sections['open questions'];
    if (oq) {
      const questions = oq.split('\n')
        .filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'))
        .map(l => l.replace(/^[\s\-\*]+/, '').trim())
        .filter(Boolean);
      questions.forEach(q => {
        staleQuestions.push({ feature: f.yaml.feature || f.yaml.title, question: q, date: f.yaml.date });
      });
    }
  });

  // 4. Untracked files (in entity files: but not in any info File Map)
  const fileMapPaths = new Set();
  features.forEach(f => {
    const sections = f.sectionContent || {};
    const fm = sections['File Map'] || '';
    const pathMatches = fm.match(/`([^`]+\.[a-z]+)`/g) || [];
    pathMatches.forEach(m => fileMapPaths.add(m.replace(/`/g, '')));
  });

  const untrackedFiles = [];
  const seenPaths = new Set();
  entities.forEach(e => {
    const files = (e.yaml && e.yaml.files) || [];
    files.forEach(f => {
      if (!fileMapPaths.has(f.path) && !seenPaths.has(f.path)) {
        seenPaths.add(f.path);
        untrackedFiles.push({ path: f.path, entity: e.yaml.title, feature: e.yaml.feature });
      }
    });
  });

  // 5. Features with no recent activity (30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const featureActivity = {};
  entities.forEach(e => {
    if (e.yaml && e.yaml.feature && e.yaml.date) {
      const d = new Date(e.yaml.date);
      if (!featureActivity[e.yaml.feature] || d > featureActivity[e.yaml.feature]) {
        featureActivity[e.yaml.feature] = d;
      }
    }
  });
  const featuresNoRecentUpdate = Object.entries(featureActivity)
    .filter(([, lastDate]) => lastDate < thirtyDaysAgo)
    .map(([feature, lastDate]) => ({ feature, lastDate: lastDate.toISOString().slice(0, 10) }));

  return { bugsNoRootCause, recurringSources, staleQuestions, untrackedFiles, featuresNoRecentUpdate };
}

function renderGapStat(label, count, icon, color) {
  return `
    <div class="col-6 col-md-3">
      <div class="stat-card">
        <div class="stat-value" style="color: ${color}">
          <i class="bi ${icon}" style="font-size: 0.9rem; margin-right: 0.3rem;"></i>${count}
        </div>
        <div class="stat-label">${label}</div>
      </div>
    </div>
  `;
}

function renderSection(title, icon, description, content) {
  return `
    <div class="card mb-3">
      <div class="card-header">
        <i class="bi ${icon}" style="margin-right: 0.5rem;"></i>
        ${title}
      </div>
      <div class="card-body">
        <p class="gaps-description">${description}</p>
        ${content}
      </div>
    </div>
  `;
}

function renderBugsList(bugs) {
  return `<div class="gaps-list">${bugs.map(b => `
    <div class="gaps-item">
      <span class="gaps-item-icon"><i class="bi bi-bug"></i></span>
      <span class="gaps-item-title">${escapeHtml(b.yaml.title)}</span>
      <span class="badge badge-severity ${b.yaml.severity || 'medium'}">${b.yaml.severity || '?'}</span>
      <span class="badge badge-status ${b.yaml.status}">${b.yaml.status}</span>
    </div>
  `).join('')}</div>`;
}

function renderRecurrenceList(sources) {
  return `<div class="gaps-list">${sources.map(s => `
    <div class="gaps-item gaps-item-recurrence">
      <span class="gaps-item-icon"><i class="bi bi-file-earmark-code"></i></span>
      <code class="gaps-file-path">${escapeHtml(s.path)}</code>
      <span class="gaps-recurrence-count">${s.count} bugs</span>
      <span class="gaps-recurrence-detail">${s.bugs.map(b => escapeHtml(b.yaml.title)).join(', ')}</span>
    </div>
  `).join('')}</div>`;
}

function renderQuestionsList(questions) {
  return `<div class="gaps-list">${questions.map(q => `
    <div class="gaps-item">
      <span class="gaps-item-icon"><i class="bi bi-question-lg"></i></span>
      <span class="gaps-item-title">${escapeHtml(q.question)}</span>
      <span class="gaps-item-feature">${escapeHtml(q.feature)}</span>
    </div>
  `).join('')}</div>`;
}

function renderUntrackedList(files) {
  return `<div class="gaps-list">${files.map(f => `
    <div class="gaps-item">
      <span class="gaps-item-icon"><i class="bi bi-file-earmark-x"></i></span>
      <code class="gaps-file-path">${escapeHtml(f.path)}</code>
      <span class="gaps-item-feature">${escapeHtml(f.feature || 'unknown')}</span>
    </div>
  `).join('')}</div>`;
}

function renderStaleFeatures(features) {
  return `<div class="gaps-list">${features.map(f => `
    <div class="gaps-item">
      <span class="gaps-item-icon"><i class="bi bi-clock-history"></i></span>
      <span class="gaps-item-title">${escapeHtml(f.feature)}</span>
      <span class="gaps-item-meta">Last activity: ${f.lastDate}</span>
    </div>
  `).join('')}</div>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
