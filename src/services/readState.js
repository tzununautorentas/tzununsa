const KEY = 'tzunun_read';

function get() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

function set(map) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

function emit(detail) {
  window.dispatchEvent(new CustomEvent('readstatechange', { detail }));
}

export function markRead(id) {
  const map = get();
  map[id] = Date.now();
  set(map);
  emit({ id });
}

export function markAllRead(ids) {
  const map = get();
  const now = Date.now();
  ids.forEach(id => { map[id] = now; });
  set(map);
  emit({ ids });
}

export function unmarkRead(id) {
  const map = get();
  delete map[id];
  set(map);
  emit({ id });
}

export function isRead(id) {
  return id in get();
}

export function getReadMap() {
  return get();
}

export function cleanupReadIds(activeIds) {
  const map = get();
  const active = new Set(activeIds);
  let changed = false;
  Object.keys(map).forEach(id => {
    if (!active.has(id)) { delete map[id]; changed = true; }
  });
  if (changed) set(map);
}
