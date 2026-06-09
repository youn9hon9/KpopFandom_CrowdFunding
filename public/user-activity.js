const SEARCH_KEY = 'duckrowd_recent_searches';
const VIEW_KEY = 'duckrowd_view_history';
const MAX_ITEMS = 10;

function readList(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list.slice(0, MAX_ITEMS)));
}

function saveRecentSearch(query) {
  const q = String(query || '').trim();
  if (!q) return;

  const list = readList(SEARCH_KEY).filter((item) => item.q !== q);
  list.unshift({ q, at: new Date().toISOString() });
  writeList(SEARCH_KEY, list);

  if (window.currentUser) {
    fetch('/api/users/me/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'search', data: { q } })
    }).catch(() => {});
  }
}

function getRecentSearches() {
  return readList(SEARCH_KEY);
}

function saveViewHistory(project) {
  const id = parseInt(project.id, 10);
  if (Number.isNaN(id)) return;

  const entry = {
    projectId: id,
    title: project.title || '',
    at: new Date().toISOString()
  };

  const list = readList(VIEW_KEY).filter((item) => item.projectId !== id);
  list.unshift(entry);
  writeList(VIEW_KEY, list);

  if (window.currentUser) {
    fetch('/api/users/me/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'view', data: { projectId: id, title: entry.title } })
    }).catch(() => {});
  }
}

function getViewHistory() {
  return readList(VIEW_KEY);
}

async function fetchServerActivity() {
  if (!window.currentUser) return { searches: [], views: [] };
  try {
    const res = await fetch('/api/users/me/activity?limit=10');
    if (!res.ok) return { searches: [], views: [] };
    return await res.json();
  } catch {
    return { searches: [], views: [] };
  }
}

function mergeSearches(local, server) {
  const seen = new Set();
  const merged = [];
  for (const item of [...(server || []), ...local]) {
    const q = item.q || item.query;
    if (!q || seen.has(q)) continue;
    seen.add(q);
    merged.push({ q, at: item.createdAt || item.at });
    if (merged.length >= MAX_ITEMS) break;
  }
  return merged;
}

function mergeViews(local, server) {
  const seen = new Set();
  const merged = [];
  for (const item of [...(server || []), ...local]) {
    const id = item.projectId;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    merged.push({
      projectId: id,
      title: item.title || '',
      at: item.createdAt || item.at
    });
    if (merged.length >= MAX_ITEMS) break;
  }
  return merged;
}

window.UserActivity = {
  saveRecentSearch,
  getRecentSearches,
  saveViewHistory,
  getViewHistory,
  fetchServerActivity,
  mergeSearches,
  mergeViews,
  MAX_ITEMS
};
