/**
 * Impact Radar view — shows cross-feature file overlaps and shared risk areas.
 */

import { getData } from '../data.js';

export function renderImpactRadar() {
  const container = document.getElementById('view-impact-radar');
  const data = getData();
  if (!container || !data) return;

  const entities = data.entities || [];
  const analysis = analyzeImpact(entities);

  container.innerHTML = `
    <div class="impact-radar-view">
      <div class="row g-3 mb-4">
        ${renderRadarStat('Shared Files', analysis.sharedFiles.length, 'bi-intersect', 'var(--color-blue)')}
        ${renderRadarStat('Features Affected', analysis.affectedFeatures.size, 'bi-diagram-3', 'var(--color-purple)')}
        ${renderRadarStat('High-Risk Files', analysis.highRiskFiles.length, 'bi-exclamation-diamond', 'var(--color-red)')}
        ${renderRadarStat('Cross-Feature Bugs', analysis.crossFeatureBugs.length, 'bi-bug', 'var(--color-orange)')}
      </div>

      ${analysis.highRiskFiles.length ? renderRiskSection(analysis.highRiskFiles) : ''}

      ${analysis.sharedFiles.length ? renderOverlapMatrix(analysis.sharedFiles) : ''}

      ${analysis.crossFeatureBugs.length ? renderCrossFeatureBugs(analysis.crossFeatureBugs) : ''}

      ${!analysis.sharedFiles.length ? '<div class="gaps-empty-state"><i class="bi bi-shield-check"></i><p>No cross-feature file overlaps detected. Features are well-isolated.</p></div>' : ''}
    </div>
  `;
}

function analyzeImpact(entities) {
  const features = entities.filter(e => e.yaml && e.yaml.type === 'feature' && e.yaml.role === 'info');

  // Build file → features map from File Map sections
  const fileToFeatures = {};

  features.forEach(f => {
    const sections = f.sectionContent || {};
    const fm = sections['File Map'] || '';
    const lines = fm.split('\n');
    lines.forEach(line => {
      const match = line.match(/`([^`]+\.[a-z]+)`\s*[—–-]\s*(.*)/);
      if (match) {
        const filePath = match[1];
        const description = match[2].trim();
        if (!fileToFeatures[filePath]) fileToFeatures[filePath] = [];
        fileToFeatures[filePath].push({
          feature: f.yaml.feature || f.yaml.title,
          description
        });
      }
    });
  });

  // Shared files = files appearing in 2+ features' File Maps
  const sharedFiles = Object.entries(fileToFeatures)
    .filter(([, feats]) => feats.length >= 2)
    .map(([path, feats]) => ({ path, features: feats, count: feats.length }))
    .sort((a, b) => b.count - a.count);

  // Affected features (unique)
  const affectedFeatures = new Set();
  sharedFiles.forEach(sf => sf.features.forEach(f => affectedFeatures.add(f.feature)));

  // High-risk files: shared + appeared as root-cause in any bug
  const rootCauseFiles = new Set();
  entities.filter(e => e.yaml && e.yaml.type === 'bug').forEach(b => {
    (b.yaml.files || []).forEach(f => {
      if (f.role === 'root-cause') rootCauseFiles.add(f.path);
    });
  });

  const highRiskFiles = sharedFiles.filter(sf => rootCauseFiles.has(sf.path));

  // Cross-feature bugs: bugs where root-cause file is in another feature's File Map
  const crossFeatureBugs = [];
  entities.filter(e => e.yaml && e.yaml.type === 'bug').forEach(bug => {
    (bug.yaml.files || []).forEach(f => {
      if (f.role === 'root-cause' && fileToFeatures[f.path]) {
        const otherFeatures = fileToFeatures[f.path].filter(feat => feat.feature !== bug.yaml.feature);
        if (otherFeatures.length > 0) {
          crossFeatureBugs.push({
            bug,
            file: f.path,
            affectedFeatures: otherFeatures
          });
        }
      }
    });
  });

  return { sharedFiles, affectedFeatures, highRiskFiles, crossFeatureBugs };
}

function renderRadarStat(label, count, icon, color) {
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

function renderRiskSection(highRiskFiles) {
  return `
    <div class="card mb-3">
      <div class="card-header">
        <i class="bi bi-exclamation-diamond-fill" style="margin-right: 0.5rem; color: var(--color-red);"></i>
        High-Risk Shared Files
      </div>
      <div class="card-body">
        <p class="gaps-description">These files are shared across features AND have been root-cause of bugs. Changes here have the highest blast radius.</p>
        <div class="gaps-list">
          ${highRiskFiles.map(f => `
            <div class="gaps-item impact-high-risk">
              <span class="gaps-item-icon"><i class="bi bi-file-earmark-code"></i></span>
              <code class="gaps-file-path">${escapeHtml(f.path)}</code>
              <span class="impact-features-badges">
                ${f.features.map(feat => `<span class="impact-feature-badge">${escapeHtml(feat.feature)}</span>`).join('')}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderOverlapMatrix(sharedFiles) {
  return `
    <div class="card mb-3">
      <div class="card-header">
        <i class="bi bi-intersect" style="margin-right: 0.5rem; color: var(--color-blue);"></i>
        Shared File Ownership
      </div>
      <div class="card-body">
        <p class="gaps-description">Files that appear in multiple features' File Maps. Changes to these files may impact all listed features.</p>
        <div class="impact-overlap-list">
          ${sharedFiles.map(f => `
            <div class="impact-overlap-item">
              <div class="impact-overlap-file">
                <i class="bi bi-file-earmark-code"></i>
                <code>${escapeHtml(f.path)}</code>
              </div>
              <div class="impact-overlap-features">
                ${f.features.map(feat => `
                  <div class="impact-overlap-feature">
                    <span class="impact-feature-badge">${escapeHtml(feat.feature)}</span>
                    <span class="impact-overlap-desc">${escapeHtml(feat.description)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderCrossFeatureBugs(crossBugs) {
  return `
    <div class="card mb-3">
      <div class="card-header">
        <i class="bi bi-bug-fill" style="margin-right: 0.5rem; color: var(--color-orange);"></i>
        Cross-Feature Bug Impact
      </div>
      <div class="card-body">
        <p class="gaps-description">Bugs whose root-cause files are also used by other features. These fixes may have unintended side effects.</p>
        <div class="gaps-list">
          ${crossBugs.map(cb => `
            <div class="gaps-item">
              <span class="gaps-item-icon"><i class="bi bi-bug"></i></span>
              <span class="gaps-item-title">${escapeHtml(cb.bug.yaml.title)}</span>
              <span class="impact-arrow">→</span>
              <span class="impact-features-badges">
                ${cb.affectedFeatures.map(f => `<span class="impact-feature-badge impact-feature-warning">${escapeHtml(f.feature)}</span>`).join('')}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
