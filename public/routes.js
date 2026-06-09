// Shared URL builders and parsers for Duckrowd page routes

function projectUrl(projectId, { tab, post } = {}) {
  const id = encodeURIComponent(String(projectId));
  if (post) {
    return `/projects/${id}/posts/${encodeURIComponent(post)}`;
  }
  const params = new URLSearchParams();
  if (tab) params.set('tab', tab);
  const qs = params.toString();
  return qs ? `/projects/${id}?${qs}` : `/projects/${id}`;
}

function parseProjectRoute() {
  const path = window.location.pathname;

  const postMatch = path.match(/^\/projects\/(\d+)\/posts\/([^/]+)\/?$/);
  if (postMatch) {
    return {
      id: postMatch[1],
      tab: 'community',
      post: decodeURIComponent(postMatch[2])
    };
  }

  const projectMatch = path.match(/^\/projects\/(\d+)\/?$/);
  if (projectMatch) {
    const params = new URLSearchParams(window.location.search);
    return {
      id: projectMatch[1],
      tab: params.get('tab'),
      post: params.get('post')
    };
  }

  const params = new URLSearchParams(window.location.search);
  const legacyId = params.get('id');
  if (legacyId) {
    return {
      id: legacyId,
      tab: params.get('tab'),
      post: params.get('post')
    };
  }

  return null;
}

function adminUrl({ projectId, view } = {}) {
  if (projectId) return `/admin/projects/${encodeURIComponent(String(projectId))}`;
  if (view === 'all') return '/admin?view=all';
  return '/admin';
}

function parseAdminRoute() {
  const path = window.location.pathname;
  const projectMatch = path.match(/^\/admin\/projects\/(\d+)\/?$/);
  if (projectMatch) {
    return { projectId: projectMatch[1], view: null };
  }

  if (path === '/admin' || path === '/admin/') {
    const params = new URLSearchParams(window.location.search);
    return { projectId: null, view: params.get('view') };
  }

  const params = new URLSearchParams(window.location.search);
  const legacyId = params.get('id');
  if (legacyId) {
    return { projectId: legacyId, view: params.get('view') };
  }

  return { projectId: null, view: params.get('view') };
}

function mypageUrl(tab) {
  return tab ? `/mypage?tab=${encodeURIComponent(tab)}` : '/mypage';
}

window.DuckrowdRoutes = {
  projectUrl,
  parseProjectRoute,
  adminUrl,
  parseAdminRoute,
  mypageUrl
};
