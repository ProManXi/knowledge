/**
 * Data layer — loads vault data and provides filtered access.
 * Single source of truth for all views.
 */

let _data = null;
let _filters = { from: null, to: null, feature: null, status: null };
let _onFilterChange = null;

/** Loads data.json and returns the parsed data object. */
export async function loadData() {
  const response = await fetch('data.json');
  if (!response.ok) throw new Error('Could not load data.json');
  _data = await response.json();
  return _data;
}

/** Returns the raw data object. */
export function getData() {
  return _data;
}

/** Returns current filter state. */
export function getFilters() {
  return { ..._filters };
}

/** Updates one or more filter values and triggers callback. */
export function setFilter(key, value) {
  _filters[key] = value || null;
  if (_onFilterChange) _onFilterChange(_filters);
}

/** Resets all filters to null. */
export function clearFilters() {
  _filters = { from: null, to: null, feature: null, status: null };
  if (_onFilterChange) _onFilterChange(_filters);
}

/** Registers a callback for filter changes. */
export function onFilterChange(callback) {
  _onFilterChange = callback;
}

/** Returns true if any filter is active. */
export function hasActiveFilters() {
  return Object.values(_filters).some(v => v !== null);
}

/** Returns entities filtered by current filters and optional type. */
export function getFilteredEntities(type = null) {
  if (!_data) return [];
  let items = _data.entities;

  if (type) items = items.filter(e => e.yaml.type === type);
  if (_filters.from) items = items.filter(e => e.yaml.date >= _filters.from);
  if (_filters.to) items = items.filter(e => e.yaml.date <= _filters.to);
  if (_filters.feature) items = items.filter(e => e.yaml.feature === _filters.feature);
  if (_filters.status) items = items.filter(e => e.yaml.status === _filters.status);

  return items;
}

/** Returns all feature hub IDs. */
export function getFeatureList() {
  if (!_data) return [];
  return _data.entities
    .filter(e => e.yaml.role === 'hub')
    .map(e => e.id);
}

/** Finds a single entity by ID. */
export function getEntityById(id) {
  if (!_data) return null;
  return _data.entities.find(e => e.id === id) || null;
}

/** Returns filtered timeline items. */
export function getFilteredTimeline() {
  if (!_data) return [];
  let items = _data.timeline;

  if (_filters.from) items = items.filter(i => i.date >= _filters.from);
  if (_filters.to) items = items.filter(i => i.date <= _filters.to);
  if (_filters.feature) items = items.filter(i => i.feature === _filters.feature);
  if (_filters.status) items = items.filter(i => i.status === _filters.status);

  return items;
}
