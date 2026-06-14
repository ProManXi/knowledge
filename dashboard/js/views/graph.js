/**
 * Graph view — Interactive relationship visualization using vis.js Network.
 * Nodes grouped by project with clear hierarchy: project → feature → entities.
 * Tooltips rendered as DOM elements for proper HTML display.
 */

import { getData } from '../data.js';
import { getCurrentProject } from '../components/navigation.js';
import { TYPE_COLORS, workItemId } from '../utils.js';
import { openEntityContent } from './entity-content.js';

let network = null;
let rotationAnimationId = null;

/** Renders the interactive vis.js graph. */
export function renderGraph() {
  const data = getData();
  if (!data) return;

  const container = document.getElementById('graph-container');
  let { nodes, edges } = data.graph;

  // Filter out decisions
  const excludedTypes = new Set(['decision']);
  nodes = nodes.filter(n => !excludedTypes.has(n.type));
  const nodeIds = new Set(nodes.map(n => n.id));
  edges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

  // Project scope
  const project = getCurrentProject();
  if (project) {
    const projectEntities = new Set(data.entities.filter(e => e.yaml.project === project).map(e => e.id));
    nodes = nodes.filter(n => projectEntities.has(n.id));
    edges = edges.filter(e => projectEntities.has(e.source) && projectEntities.has(e.target));
  }

  // Assign groups (by project) for clustering
  const entityMap = {};
  data.entities.forEach(e => { entityMap[e.id] = e; });

  // Convert to vis.js format
  const visNodes = new vis.DataSet(nodes.map(n => {
    const entity = entityMap[n.id];
    const projectName = entity ? entity.yaml.project : 'unknown';

    return {
      id: n.id,
      label: getLabel(n),
      title: buildTooltipElement(n),
      group: projectName,
      color: {
        background: n.type === 'project' ? '#007AFF' : (n.role === 'info' ? TYPE_COLORS.info : (TYPE_COLORS[n.type] || '#5856D6')),
        border: n.type === 'project' ? '#0055CC' : darken(n.role === 'info' ? TYPE_COLORS.info : (TYPE_COLORS[n.type] || '#5856D6')),
        highlight: { background: lighten(n.role === 'info' ? TYPE_COLORS.info : (TYPE_COLORS[n.type] || '#5856D6')), border: '#1d1d1f' },
        hover: { background: lighten(n.role === 'info' ? TYPE_COLORS.info : (TYPE_COLORS[n.type] || '#5856D6')), border: '#1d1d1f' }
      },
      size: getNodeSize(n),
      font: {
        color: '#1d1d1f',
        size: n.type === 'project' ? 18 : (n.role === 'hub' ? 13 : 8),
        face: 'Inter, sans-serif',
        strokeWidth: n.type === 'project' ? 4 : 3,
        strokeColor: '#ffffff',
        bold: n.type === 'project'
      },
      shape: getNodeShape(n),
      borderWidth: n.type === 'project' ? 3 : (n.severity === 'critical' ? 3 : 1.5),
      mass: n.type === 'project' ? 10 : (n.role === 'hub' ? 5 : 1)
    };
  }));

  const visEdges = new vis.DataSet(edges.map((e, i) => {
    const isHierarchy = e.type === 'hierarchy';
    const isCausal = e.type === 'causal';
    return {
      id: i,
      from: e.source,
      to: e.target,
      label: isCausal ? e.label : undefined,
      arrows: (isHierarchy || isCausal) ? { to: { enabled: true, scaleFactor: isCausal ? 0.8 : 0.5, type: 'arrow' } } : { to: { enabled: false } },
      color: isHierarchy
        ? { color: 'rgba(0,122,255,0.2)', highlight: 'rgba(0,122,255,0.6)', hover: 'rgba(0,122,255,0.35)' }
        : isCausal
          ? { color: 'rgba(255,59,48,0.5)', highlight: 'rgba(255,59,48,0.9)', hover: 'rgba(255,59,48,0.7)' }
          : { color: 'rgba(142,142,147,0.12)', highlight: 'rgba(88,86,214,0.4)', hover: 'rgba(88,86,214,0.2)' },
      width: isCausal ? 2.5 : (isHierarchy ? 2 : 0.5),
      dashes: isCausal ? [8, 4] : (!isHierarchy ? true : false),
      smooth: isHierarchy
        ? { enabled: true, type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.4 }
        : { type: 'continuous', roundness: 0.5 },
      font: isCausal ? { size: 9, color: '#FF3B30', strokeWidth: 2, strokeColor: '#ffffff', align: 'top' } : undefined,
      hoverWidth: 0.5
    };
  }));

  const options = {
    nodes: {
      borderWidth: 1.5,
      borderWidthSelected: 3
    },
    edges: {
      arrows: { to: { enabled: false } },
      selectionWidth: 2
    },
    groups: buildGroups(data),
    physics: {
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -200,
        centralGravity: 0.003,
        springLength: 250,
        springConstant: 0.015,
        damping: 0.6,
        avoidOverlap: 1.0
      },
      stabilization: {
        iterations: 400,
        fit: true
      },
      maxVelocity: 25,
      minVelocity: 0.3
    },
    interaction: {
      hover: true,
      tooltipDelay: 150,
      zoomView: true,
      dragView: true,
      dragNodes: true,
      navigationButtons: false,
      keyboard: { enabled: true },
      multiselect: false
    },
    layout: {
      improvedLayout: true,
      clusterThreshold: 200
    }
  };

  // Destroy previous network
  if (rotationAnimationId) {
    cancelAnimationFrame(rotationAnimationId);
    rotationAnimationId = null;
  }
  if (network) {
    network.destroy();
    network = null;
  }

  network = new vis.Network(container, { nodes: visNodes, edges: visEdges }, options);

  // Start slow rotation after stabilization (1 full rotation per 60 seconds)
  network.once('stabilized', () => {
    startRotation(network);
  });

  // Pause rotation on user interaction, resume after
  network.on('dragStart', () => stopRotation());
  network.on('zoom', () => {
    stopRotation();
    clearTimeout(network._rotationResumeTimer);
    network._rotationResumeTimer = setTimeout(() => startRotation(network), 3000);
  });
  network.on('dragEnd', () => {
    clearTimeout(network._rotationResumeTimer);
    network._rotationResumeTimer = setTimeout(() => startRotation(network), 3000);
  });

  // Double-click to open entity
  network.on('doubleClick', (params) => {
    if (params.nodes.length > 0) {
      openEntityContent(params.nodes[0]);
    }
  });

  // Single click highlights connections
  network.on('click', (params) => {
    if (params.nodes.length > 0) {
      const nodeId = params.nodes[0];
      const connectedNodes = network.getConnectedNodes(nodeId);
      const connectedEdges = network.getConnectedEdges(nodeId);
      network.selectNodes([nodeId, ...connectedNodes]);
      network.selectEdges(connectedEdges);
    }
  });

  // Add legend
  renderLegend(container);
}

/** Builds tooltip as a DOM element (vis.js renders DOM elements as HTML). */
function buildTooltipElement(node) {
  const el = document.createElement('div');
  el.classList.add('graph-tooltip');
  const wid = workItemId(node.type, node.numericId);

  el.innerHTML = `
    <div class="graph-tooltip-id">${wid}</div>
    <div class="graph-tooltip-title">${node.title || node.id}</div>
    <div class="graph-tooltip-meta">
      <span>Type: ${node.type}</span>
      ${node.status ? `<span>Status: ${node.status}</span>` : ''}
      ${node.severity ? `<span class="severity">Severity: ${node.severity}</span>` : ''}
    </div>
    <div class="graph-tooltip-hint">Double-click to open</div>
  `;
  return el;
}

function getLabel(node) {
  if (node.type === 'project') return node.title || node.id;
  if (node.role === 'hub') return node.title || node.id;
  // Shorter labels for leaf nodes
  const title = node.title || node.id;
  return title.length > 20 ? title.slice(0, 18) + '…' : title;
}

function getNodeSize(node) {
  if (node.type === 'project') return 40;
  if (node.role === 'hub') return 28;
  if (node.type === 'bug' || node.type === 'incident') return 18;
  return 14;
}

function getNodeShape(node) {
  if (node.type === 'project') return 'diamond';
  if (node.role === 'hub') return 'hexagon';
  if (node.role === 'info') return 'database';
  if (node.type === 'bug') return 'triangle';
  if (node.type === 'incident') return 'star';
  if (node.type === 'decision') return 'square';
  if (node.type === 'ticket') return 'box';
  return 'dot';
}

function buildGroups(data) {
  const groups = {};
  const projects = [...new Set(data.entities.map(e => e.yaml.project).filter(Boolean))];
  const projectColors = ['#007AFF', '#5856D6', '#34C759', '#FF9500', '#FF3B30'];

  projects.forEach((p, i) => {
    groups[p] = {
      color: { background: projectColors[i % projectColors.length] + '12', border: projectColors[i % projectColors.length] }
    };
  });
  return groups;
}

function renderLegend(container) {
  // Remove any existing legend
  const existing = container.querySelector('.graph-legend');
  if (existing) existing.remove();

  const legend = document.createElement('div');
  legend.className = 'graph-legend';
  legend.innerHTML = `
    <div class="graph-legend-title">Legend</div>
    <div class="graph-legend-item"><span class="legend-shape" style="background:${TYPE_COLORS.project}">&#x25C6;</span> Project</div>
    <div class="graph-legend-item"><span class="legend-shape" style="background:${TYPE_COLORS.feature}">&#x2B21;</span> Feature</div>
    <div class="graph-legend-item"><span class="legend-shape" style="background:${TYPE_COLORS.info}">&#x2299;</span> Info</div>
    <div class="graph-legend-item"><span class="legend-shape" style="background:${TYPE_COLORS.session}">&#x25CF;</span> Session</div>
    <div class="graph-legend-item"><span class="legend-shape" style="background:${TYPE_COLORS.bug}">&#x25B2;</span> Bug</div>
    <div class="graph-legend-item"><span class="legend-shape" style="background:${TYPE_COLORS.incident}">&#x2605;</span> Incident</div>
    <div class="graph-legend-item"><span class="legend-shape" style="background:${TYPE_COLORS.ticket}">&#x25AC;</span> Ticket</div>
    <div class="graph-legend-item" style="margin-top:0.5rem; border-top: 1px solid rgba(0,0,0,0.06); padding-top: 0.4rem;"><span style="display:inline-block;width:18px;height:2px;background:#FF3B30;vertical-align:middle;margin-right:6px;border-radius:1px;"></span> Causal Link</div>
  `;
  container.appendChild(legend);
}

function lighten(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)})`;
}

function darken(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`;
}

// ─── Rotation Animation ─────────────────────────────────────────────────────

const ROTATION_PERIOD_MS = 60000; // 1 full rotation per 60 seconds
const TWO_PI = 2 * Math.PI;

function startRotation(net) {
  if (rotationAnimationId) return; // already running
  if (!net) return;

  const startTime = performance.now();
  const startPos = net.getViewPosition();
  const scale = net.getScale();

  // Calculate orbit radius based on current view offset from center (0,0)
  const radius = Math.max(30, Math.sqrt(startPos.x * startPos.x + startPos.y * startPos.y) || 80);
  const startAngle = Math.atan2(startPos.y, startPos.x);

  function frame(now) {
    if (!network) return;
    const elapsed = now - startTime;
    const angle = startAngle + (elapsed / ROTATION_PERIOD_MS) * TWO_PI;

    network.moveTo({
      position: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius },
      scale: scale,
      animation: false
    });

    rotationAnimationId = requestAnimationFrame(frame);
  }

  rotationAnimationId = requestAnimationFrame(frame);
}

function stopRotation() {
  if (rotationAnimationId) {
    cancelAnimationFrame(rotationAnimationId);
    rotationAnimationId = null;
  }
}
