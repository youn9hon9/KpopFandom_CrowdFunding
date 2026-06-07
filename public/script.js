const API_BASE = '';

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
  const link = document.createElement('a');
  link.href = `detail.html?id=${project.id}`;
  link.className = 'project-card';

  link.innerHTML = `
    <div class="card-thumb" style="background:${project.gradient}">
      <span class="status-badge ${statusClass}">${project.status}</span>
      <span class="card-thumb-emoji">${project.emoji}</span>
    </div>
    <div class="card-body">
      <p class="card-category">${project.category}</p>
      <div class="card-host">
        <span class="card-host-name">총대 ${project.hostName}</span>
        ${renderTrustTemp(project.trustTemperature)}
      </div>
      <h3 class="card-title">${project.title}</h3>
      <p class="card-progress"><span class="card-percent">${project.percentFunded}%</span> 달성</p>
      <p class="card-meta">${formatCurrency(project.currentAmount)} · D-${project.daysLeft}일</p>
    </div>
  `;

  return link;
}

function renderPopularItem(project, rank) {
  const li = document.createElement('li');
  li.className = 'popular-item';

  const link = document.createElement('a');
  link.href = `detail.html?id=${project.id}`;
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

async function fetchFeatured() {
  const res = await fetch(`${API_BASE}/api/projects/featured`);
  if (!res.ok) throw new Error('Featured fetch failed');
  return res.json();
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

function renderFeatured(projects) {
  const grid = document.getElementById('featured-grid');
  grid.innerHTML = '';

  if (!projects.length) {
    grid.innerHTML = '<p class="error-msg">표시할 프로젝트가 없습니다.</p>';
    return;
  }

  projects.forEach((project) => {
    grid.appendChild(renderCard(project));
  });
}

function renderPopular(projects) {
  const list = document.getElementById('popular-list');
  list.innerHTML = '';

  projects.forEach((project, index) => {
    list.appendChild(renderPopularItem(project, index + 1));
  });
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

function initDemoButtons() {
  document.querySelectorAll('[data-demo]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (el.tagName === 'A' && el.getAttribute('href') === '/') return;
      e.preventDefault();
      alert('데모 기능입니다. 시연용 MVP에서는 실제 동작하지 않습니다.');
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  initDemoButtons();

  try {
    const [featured, popular, heroSlides] = await Promise.all([
      fetchFeatured(),
      fetchPopular(),
      fetchHeroSlides()
    ]);

    renderFeatured(featured);
    renderPopular(popular);
    initHeroSlider(heroSlides);
  } catch (err) {
    console.error(err);
    document.getElementById('featured-grid').innerHTML =
      '<p class="error-msg">데이터를 불러오지 못했습니다. 서버가 실행 중인지 확인해주세요.</p>';
    document.getElementById('popular-list').innerHTML = '';
  }
});
