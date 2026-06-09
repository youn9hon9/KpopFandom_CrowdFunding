const API_BASE = '';

const FILTER_LABELS = {
  featured: '주목할 만한 프로젝트',
  all: '전체 프로젝트',
  ongoing: '상시 판매 · 펀딩 진행 중',
  popular: '인기 프로젝트',
  new: '신규 프로젝트',
  upcoming: '공개 예정 · 심사 중',
  closing: '마감 임박'
};

const PAGE_SIZE = 12;

let listState = { filter: 'featured', category: '', artist: '', q: '', sort: '', offset: 0, limit: PAGE_SIZE };
let listMeta = { total: 0, hasMore: false };

function formatCurrency(amount) {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

function getStatusClass(status) {
  if (status === '심사 중') return 'status-badge--review';
  if (status.includes('무산') || status.includes('환불')) return 'status-badge--failed';
  return 'status-badge--funding';
}

function getTrustBarClass(temp) {
  if (temp >= 80) return 'trust-bar--high';
  if (temp >= 60) return 'trust-bar--mid';
  return 'trust-bar--low';
}

function renderTrustTemp(temperature, showBar = true) {
  const barClass = getTrustBarClass(temperature);
  const barHtml = showBar
    ? `<span class="trust-bar-wrap"><span class="trust-bar ${barClass}" style="width:${temperature}%"></span></span>`
    : '';
  return `<span class="trust-temp">🌡️${temperature}도${barHtml}</span>`;
}

function renderCard(project) {
  const statusClass = getStatusClass(project.status);
  const wrap = document.createElement('div');
  wrap.className = 'project-card-wrap';

  const favBtn = document.createElement('button');
  favBtn.type = 'button';
  favBtn.className = 'btn-favorite';
  favBtn.dataset.projectId = String(project.id);
  favBtn.setAttribute('aria-label', '관심 프로젝트');
  favBtn.title = '관심 프로젝트에 추가';
  favBtn.textContent = '♡';

  const link = document.createElement('a');
  link.href = window.DuckrowdRoutes
    ? DuckrowdRoutes.projectUrl(project.id)
    : `/projects/${project.id}`;
  link.className = 'project-card';

  const thumbInner = project.coverImage
    ? `<img src="${project.coverImage}" alt="" class="card-cover-img">`
    : `<span class="card-thumb-emoji">${project.emoji}</span>`;

  link.innerHTML = `
    <div class="card-thumb" style="background:${project.gradient}">
      <span class="status-badge ${statusClass}">${project.status}</span>
      ${thumbInner}
    </div>
    <div class="card-body">
      <p class="card-category">${project.artist ? project.artist : project.category}</p>
      <div class="card-host">
        <span class="card-host-name">총대 ${project.hostName}</span>
        ${renderTrustTemp(project.trustTemperature)}
      </div>
      <h3 class="card-title">${project.title}</h3>
      <p class="card-progress"><span class="card-percent">${project.percentFunded}%</span> 달성</p>
      <p class="card-meta">${formatCurrency(project.currentAmount)} · D-${project.daysLeft}일</p>
    </div>
  `;

  wrap.appendChild(favBtn);
  wrap.appendChild(link);
  return wrap;
}

function renderProjectSkeletons(count = 6) {
  const grid = document.getElementById('featured-grid');
  grid.classList.add('project-grid--loading');
  grid.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'project-card-skeleton';
    el.innerHTML = `
      <div class="skeleton skeleton-thumb"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line skeleton-line--short"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line skeleton-line--medium"></div>
      </div>
    `;
    grid.appendChild(el);
  }
}

function renderPopularItem(project, rank) {
  const li = document.createElement('li');
  li.className = 'popular-item';

  const link = document.createElement('a');
  link.href = window.DuckrowdRoutes
    ? DuckrowdRoutes.projectUrl(project.id)
    : `/projects/${project.id}`;
  link.style.cssText = 'display:flex;align-items:center;gap:12px;width:100%';
  link.innerHTML = `
    <span class="popular-rank">${rank}</span>
    <div class="popular-thumb" style="background:${project.gradient}">${project.emoji}</div>
    <div class="popular-info">
      <p class="popular-title">${project.title}</p>
      <p class="popular-meta">D-${project.daysLeft}일 · <span class="card-percent">${project.percentFunded}%</span> 달성</p>
    </div>
  `;
  li.appendChild(link);

  return li;
}

function readUrlState() {
  const params = new URLSearchParams(window.location.search);
  listState.filter = params.get('filter') || 'featured';
  listState.category = params.get('category') || '';
  listState.artist = params.get('artist') || '';
  listState.q = params.get('q') || '';
  listState.sort = params.get('sort') || '';
  const offset = parseInt(params.get('offset') || '0', 10);
  listState.offset = Number.isNaN(offset) || offset < 0 ? 0 : offset;
}

function updateUrlState(push = false) {
  const params = new URLSearchParams();
  if (listState.filter && listState.filter !== 'featured') params.set('filter', listState.filter);
  if (listState.category) params.set('category', listState.category);
  if (listState.artist) params.set('artist', listState.artist);
  if (listState.q) params.set('q', listState.q);
  if (listState.sort) params.set('sort', listState.sort);
  if (listState.offset > 0) params.set('offset', String(listState.offset));
  const qs = params.toString();
  const url = qs ? `/?${qs}` : '/';
  if (push) {
    history.pushState(null, '', url);
  } else {
    history.replaceState(null, '', url);
  }
}

function syncNavActive() {
  document.querySelectorAll('.nav-link[data-filter]').forEach((link) => {
    const active =
      link.dataset.filter === listState.filter && !listState.category && !listState.artist && !listState.q;
    link.classList.toggle('active', active);
  });
  document.querySelectorAll('.shortcut-item[data-artist]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.artist === listState.artist);
  });
}

function renderActiveFilters() {
  const el = document.getElementById('active-filters');
  const chips = [];
  if (listState.artist) {
    chips.push({ type: 'artist', label: `아티스트: ${listState.artist}` });
  }
  if (listState.category) {
    chips.push({ type: 'category', label: `카테고리: ${listState.category}` });
  }
  if (listState.q) {
    chips.push({ type: 'q', label: `검색: "${listState.q}"` });
  }
  if (!chips.length) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }
  el.hidden = false;
  el.innerHTML = chips
    .map(
      (c) =>
        `<span class="filter-chip">${c.label}<button type="button" class="filter-chip-clear" data-clear="${c.type}" aria-label="필터 제거">×</button></span>`
    )
    .join('');
  el.querySelectorAll('.filter-chip-clear').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.clear === 'artist') listState.artist = '';
      if (btn.dataset.clear === 'category') listState.category = '';
      if (btn.dataset.clear === 'q') {
        listState.q = '';
        document.getElementById('search-input').value = '';
      }
      updateUrlState(true);
      loadProjectList();
    });
  });
}

async function fetchProjects({ append = false } = {}) {
  const params = new URLSearchParams();
  if (listState.filter) params.set('filter', listState.filter);
  if (listState.category) params.set('category', listState.category);
  if (listState.artist) params.set('artist', listState.artist);
  if (listState.q) params.set('q', listState.q);
  if (listState.sort) params.set('sort', listState.sort);
  params.set('limit', String(listState.limit));
  params.set('offset', String(listState.offset));
  const res = await fetch(`${API_BASE}/api/projects?${params}`);
  if (!res.ok) throw new Error('Projects fetch failed');
  const data = await res.json();
  return { ...data, append };
}

async function fetchPopular() {
  const res = await fetch(`${API_BASE}/api/projects/popular`);
  if (!res.ok) throw new Error('Popular fetch failed');
  return res.json();
}

async function fetchHeroSlides() {
  const res = await fetch(`${API_BASE}/api/hero-slides`);
  if (!res.ok) return [];
  return res.json();
}

function renderFeatured(projects, meta, { append = false } = {}) {
  const grid = document.getElementById('featured-grid');
  const titleEl = document.getElementById('projects-title');
  const metaEl = document.getElementById('projects-meta');

  titleEl.textContent = meta?.label || FILTER_LABELS[listState.filter] || '프로젝트';
  if (meta) {
    const shown = grid.querySelectorAll('.project-card').length;
    metaEl.textContent = `${shown}/${meta.count}개 표시`;
  } else {
    metaEl.textContent = '';
  }

  grid.classList.remove('project-grid--loading');
  if (!append) grid.innerHTML = '';
  if (!projects.length && !append) {
    grid.innerHTML = '<p class="error-msg">조건에 맞는 프로젝트가 없습니다. 필터를 변경해 보세요.</p>';
    renderPagination(meta, 0);
    return;
  }
  projects.forEach((project) => grid.appendChild(renderCard(project)));
  if (window.FavoriteStore) window.FavoriteStore.bindButtons(grid);
  renderPagination(meta, projects.length);
}

function renderPagination(meta, batchCount = 0) {
  const bar = document.getElementById('pagination-bar');
  const info = document.getElementById('pagination-info');
  const prevBtn = document.getElementById('pagination-prev');
  const moreBtn = document.getElementById('pagination-more');
  if (!bar || !meta) {
    if (bar) bar.hidden = true;
    return;
  }

  const grid = document.getElementById('featured-grid');
  const shown = grid ? grid.querySelectorAll('.project-card').length : listState.offset + batchCount;
  const total = meta.count || 0;
  const hasPrev = listState.offset > 0;
  const hasMore = meta.hasMore;

  if (total <= listState.limit && !hasPrev) {
    bar.hidden = true;
    return;
  }

  bar.hidden = false;
  info.textContent = `${shown} / ${total}`;
  prevBtn.disabled = !hasPrev;
  moreBtn.hidden = !hasMore;
  moreBtn.disabled = !hasMore;
}

function renderPopular(projects) {
  const list = document.getElementById('popular-list');
  list.innerHTML = '';
  if (!projects.length) {
    list.innerHTML = '<li class="escrow-empty">인기 프로젝트가 없습니다.</li>';
    return;
  }
  projects.forEach((project, index) => list.appendChild(renderPopularItem(project, index + 1)));
}

async function loadProjectList({ append = false } = {}) {
  const grid = document.getElementById('featured-grid');
  if (!append) {
    renderProjectSkeletons(6);
  }
  syncNavActive();
  renderActiveFilters();
  syncSortSelect();

  try {
    const data = await fetchProjects({ append });
    listMeta = { total: data.count, hasMore: data.hasMore };
    renderFeatured(data.projects, data, { append });
  } catch (err) {
    console.error(err);
    const msg = '데이터를 불러오지 못했습니다. 서버가 실행 중인지 확인해주세요.';
    if (typeof showToast === 'function') showToast(msg, 'error');
    grid.innerHTML = `<p class="error-msg">${msg}</p>`;
  }
}

let heroSlideIndex = 0;
let heroInterval = null;

function initHeroSlider(slides) {
  if (!slides.length) return;

  const titleEl = document.getElementById('hero-title');
  const subtitleEl = document.getElementById('hero-subtitle');
  const visualEl = document.getElementById('hero-visual');
  const emojiEl = document.getElementById('hero-emoji');
  const dotsEl = document.getElementById('hero-dots');

  dotsEl.innerHTML = '';
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `hero-dot${i === 0 ? ' active' : ''}`;
    dot.setAttribute('aria-label', `슬라이드 ${i + 1}`);
    dot.addEventListener('click', () => {
      heroSlideIndex = i;
      updateHeroSlide();
      resetHeroInterval();
    });
    dotsEl.appendChild(dot);
  });

  function updateHeroSlide() {
    const slide = slides[heroSlideIndex];
    titleEl.textContent = slide.title;
    subtitleEl.textContent = slide.subtitle;
    visualEl.style.background = slide.gradient;
    emojiEl.textContent = slide.emoji;
    dotsEl.querySelectorAll('.hero-dot').forEach((d, i) => {
      d.classList.toggle('active', i === heroSlideIndex);
    });
  }

  function resetHeroInterval() {
    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(() => {
      heroSlideIndex = (heroSlideIndex + 1) % slides.length;
      updateHeroSlide();
    }, 5000);
  }

  updateHeroSlide();
  resetHeroInterval();
}

function applyFilter(filter, { category = null, artist = null, q = null, sort = null, resetOffset = true, scroll = true } = {}) {
  listState.filter = filter || 'featured';
  if (category !== null) listState.category = category;
  if (artist !== null) listState.artist = artist;
  if (q !== null) listState.q = q;
  if (sort !== null) listState.sort = sort;
  if (resetOffset) listState.offset = 0;
  updateUrlState(true);
  loadProjectList();
  if (scroll) {
    document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function initNavFilters() {
  document.querySelectorAll('.nav-link[data-filter]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      applyFilter(link.dataset.filter, { category: '', artist: '', q: '', scroll: true });
      document.getElementById('search-input').value = '';
    });
  });
}

function initCategoryShortcuts() {
  document.querySelectorAll('.shortcut-item[data-artist]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.artist;
      const next = listState.artist === name ? '' : name;
      applyFilter(listState.filter || 'all', { artist: next, scroll: true });
    });
  });
}

function renderRecentSearches() {
  const listEl = document.getElementById('recent-search-list');
  if (!listEl || !window.UserActivity) return;

  const items = window.UserActivity.getRecentSearches();
  if (!items.length) {
    listEl.hidden = true;
    listEl.innerHTML = '';
    return;
  }

  listEl.hidden = false;
  listEl.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'recent-search-item';
    btn.textContent = item.q;
    btn.dataset.q = item.q;
    li.appendChild(btn);
    listEl.appendChild(li);
  });

  listEl.querySelectorAll('.recent-search-item').forEach((btn) => {
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const q = btn.dataset.q;
      document.getElementById('search-input').value = q;
      applyFilter(listState.filter || 'all', { q, scroll: true });
      window.UserActivity.saveRecentSearch(q);
      listEl.hidden = true;
    });
  });
}

function initSearch() {
  const input = document.getElementById('search-input');
  const listEl = document.getElementById('recent-search-list');
  if (!input) return;

  if (listState.q) input.value = listState.q;

  let debounce = null;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      applyFilter(listState.filter || 'all', { q: input.value.trim(), scroll: false });
    }, 300);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = input.value.trim();
      if (q && window.UserActivity) window.UserActivity.saveRecentSearch(q);
      applyFilter(listState.filter || 'all', { q, scroll: true });
      if (listEl) listEl.hidden = true;
    }
  });

  input.addEventListener('focus', () => renderRecentSearches());
  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (listEl) listEl.hidden = true;
    }, 150);
  });
}

function initHeroBrowse() {
  document.getElementById('hero-browse-btn')?.addEventListener('click', () => {
    applyFilter('featured', { category: '', artist: '', q: '', sort: '', scroll: true });
  });
}

function syncSortSelect() {
  const select = document.getElementById('sort-select');
  if (select) select.value = listState.sort || '';
}

function initSortSelect() {
  const select = document.getElementById('sort-select');
  if (!select) return;
  syncSortSelect();
  select.addEventListener('change', () => {
    applyFilter(listState.filter || 'all', { sort: select.value, scroll: false });
  });
}

function initPagination() {
  document.getElementById('pagination-more')?.addEventListener('click', () => {
    if (!listMeta.hasMore) return;
    listState.offset += listState.limit;
    updateUrlState(true);
    loadProjectList({ append: true });
  });

  document.getElementById('pagination-prev')?.addEventListener('click', () => {
    if (listState.offset <= 0) return;
    listState.offset = Math.max(0, listState.offset - listState.limit);
    updateUrlState(true);
    loadProjectList();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  readUrlState();
  initNavFilters();
  initCategoryShortcuts();
  initSearch();
  initHeroBrowse();
  initSortSelect();
  initPagination();

  window.addEventListener('popstate', () => {
    readUrlState();
    document.getElementById('search-input').value = listState.q;
    syncSortSelect();
    loadProjectList();
  });

  try {
    if (typeof checkLoginStatus === 'function') await checkLoginStatus();
    if (window.FavoriteStore) await window.FavoriteStore.load();

    const [popular, heroSlides] = await Promise.all([fetchPopular(), fetchHeroSlides()]);
    await loadProjectList();
    renderPopular(popular);
    initHeroSlider(heroSlides);
  } catch (err) {
    console.error(err);
    const msg = '데이터를 불러오지 못했습니다. 서버가 실행 중인지 확인해주세요.';
    if (typeof showToast === 'function') showToast(msg, 'error');
    document.getElementById('featured-grid').innerHTML = `<p class="error-msg">${msg}</p>`;
    document.getElementById('popular-list').innerHTML = '';
  }
});
