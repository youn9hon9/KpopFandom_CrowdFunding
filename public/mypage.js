const MYPAGE_TABS = ['donations', 'hosted', 'community', 'favorites', 'history'];

function projectLink(id, opts) {
  if (window.DuckrowdRoutes) {
    return DuckrowdRoutes.projectUrl(id, opts);
  }
  const params = new URLSearchParams({ id });
  if (opts?.tab) params.set('tab', opts.tab);
  if (opts?.post) params.set('post', opts.post);
  return `/detail.html?${params}`;
}

function renderLoginRequired() {
  document.getElementById('mypage-root').innerHTML = `
    <div class="mypage-forbidden">
      <p class="error-page-code" style="font-size:3rem;">401</p>
      <h1>로그인이 필요합니다</h1>
      <p>마이페이지를 보려면 Google 또는 Kakao 계정으로 로그인해 주세요.</p>
      <a href="/?login=1" class="btn btn-primary">로그인하기</a>
    </div>
  `;
}

function renderMypageShell() {
  document.getElementById('mypage-root').innerHTML = `
    <div class="mypage-header">
      <h1 class="mypage-title">My Page</h1>
      <p class="mypage-subtitle">결제·후원 내역</p>
    </div>

    <div class="escrow-loading-overlay" id="mypage-loading">
      <div class="escrow-spinner"></div>
      <p class="escrow-loading-text" id="mypage-loading-text">결제·후원 내역 불러오는 중...</p>
    </div>

    <div class="escrow-stats">
      <div class="stat-card">
        <p class="stat-label">총 후원 금액</p>
        <p class="stat-value primary" id="stat-total-sponsored">₩0</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">결제 보관 중인 금액</p>
        <p class="stat-value" id="stat-escrow-holding" style="color:#f97316;">₩0</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">총 환불 완료액</p>
        <p class="stat-value" id="stat-total-refunded" style="color:#ef4444;">₩0</p>
      </div>
    </div>

    <div class="escrow-tabs" role="tablist">
      <button type="button" class="escrow-tab-btn active" id="tab-btn-donations" data-tab="donations">내가 참여한 후원</button>
      <button type="button" class="escrow-tab-btn" id="tab-btn-hosted" data-tab="hosted">개설 신청한 프로젝트</button>
      <button type="button" class="escrow-tab-btn" id="tab-btn-community" data-tab="community">내 커뮤니티 활동</button>
      <button type="button" class="escrow-tab-btn" id="tab-btn-favorites" data-tab="favorites">관심 프로젝트</button>
      <button type="button" class="escrow-tab-btn" id="tab-btn-history" data-tab="history">최근 활동</button>
    </div>

    <div class="mypage-export-row">
      <a href="/api/users/me/escrow/export.csv" class="btn btn-ghost btn-sm" download>후원 내역 CSV</a>
    </div>

    <div id="donations-list-container" class="escrow-list"></div>
    <div id="hosted-list-container" class="escrow-list" style="display:none;"></div>
    <div id="community-list-container" class="escrow-list" style="display:none;"></div>
    <div id="favorites-list-container" class="escrow-list" style="display:none;"></div>
    <div id="history-list-container" class="escrow-list" style="display:none;"></div>
  `;
}

function getTabElements() {
  return {
    donations: {
      btn: document.getElementById('tab-btn-donations'),
      container: document.getElementById('donations-list-container')
    },
    hosted: {
      btn: document.getElementById('tab-btn-hosted'),
      container: document.getElementById('hosted-list-container')
    },
    community: {
      btn: document.getElementById('tab-btn-community'),
      container: document.getElementById('community-list-container')
    },
    favorites: {
      btn: document.getElementById('tab-btn-favorites'),
      container: document.getElementById('favorites-list-container')
    },
    history: {
      btn: document.getElementById('tab-btn-history'),
      container: document.getElementById('history-list-container')
    }
  };
}

function activateTab(tabName, { updateUrl = true } = {}) {
  const tabs = getTabElements();
  const target = tabs[tabName] || tabs.donations;

  Object.values(tabs).forEach(({ btn, container }) => {
    btn.classList.remove('active');
    container.style.display = 'none';
  });

  target.btn.classList.add('active');
  target.container.style.display = 'flex';

  if (updateUrl && window.DuckrowdRoutes) {
    const url = tabName === 'donations' ? DuckrowdRoutes.mypageUrl() : DuckrowdRoutes.mypageUrl(tabName);
    history.replaceState(null, '', url);
  }
}

async function loadFavoritesTab(container) {
  if (!container) return;

  container.innerHTML = '<p class="loading">불러오는 중...</p>';
  try {
    const res = await fetch('/api/users/me/favorites');
    const result = await handleApiResponse(res);
    if (!result.ok) {
      container.innerHTML = '<div class="escrow-empty">관심 프로젝트를 불러오지 못했습니다.</div>';
      return;
    }

    const list = result.data.favorites || [];
    if (!list.length) {
      container.innerHTML = '<div class="escrow-empty">관심 프로젝트가 없습니다. 메인·상세에서 ♡ 버튼으로 추가할 수 있습니다.</div>';
      return;
    }

    container.innerHTML = '';
    list.forEach((p) => {
      const thumbInner = p.coverImage
        ? `<img src="${p.coverImage}" alt="" style="width:100%;height:100%;object-fit:cover;">`
        : p.emoji;
      container.insertAdjacentHTML('beforeend', `
        <div class="escrow-item-card">
          <div class="escrow-item-thumb" style="background:${p.gradient}">${thumbInner}</div>
          <div class="escrow-item-details">
            <p class="escrow-item-title"><a href="${projectLink(p.id)}" style="color:inherit;">${p.title}</a></p>
            <p class="escrow-item-meta">${p.category} · ${p.percentFunded}% 달성 · D-${p.daysLeft}일</p>
          </div>
          <div class="escrow-item-actions">
            <span class="escrow-item-amount">${formatCurrency(p.currentAmount)}</span>
            <span class="badge badge-funding">${p.status}</span>
          </div>
        </div>
      `);
    });
  } catch {
    container.innerHTML = '<div class="escrow-empty">관심 프로젝트를 불러오지 못했습니다.</div>';
  }
}

async function loadHistoryTab(container) {
  if (!container || !window.UserActivity) return;

  container.innerHTML = '<p class="loading">불러오는 중...</p>';
  const server = await window.UserActivity.fetchServerActivity();
  const searches = window.UserActivity.mergeSearches(
    window.UserActivity.getRecentSearches(),
    server.searches
  );
  const views = window.UserActivity.mergeViews(window.UserActivity.getViewHistory(), server.views);

  const searchHtml = searches.length
    ? `<ul class="activity-list">${searches
        .map((s) => `<li><a href="/?filter=all&q=${encodeURIComponent(s.q)}">${s.q}</a></li>`)
        .join('')}</ul>`
    : '<p class="escrow-empty">최근 검색어가 없습니다.</p>';

  const viewHtml = views.length
    ? `<ul class="activity-list">${views
        .map(
          (v) =>
            `<li><a href="${projectLink(v.projectId)}">${v.title || `프로젝트 #${v.projectId}`}</a></li>`
        )
        .join('')}</ul>`
    : '<p class="escrow-empty">최근 조회한 프로젝트가 없습니다.</p>';

  container.innerHTML = `
    <section class="history-section">
      <h3 class="history-section-title">최근 검색어</h3>
      ${searchHtml}
    </section>
    <section class="history-section" style="margin-top:20px;">
      <h3 class="history-section-title">최근 조회</h3>
      ${viewHtml}
    </section>
  `;
}

async function loadMypageData() {
  const loader = document.getElementById('mypage-loading');
  const donationsContainer = document.getElementById('donations-list-container');
  const hostedContainer = document.getElementById('hosted-list-container');
  const communityContainer = document.getElementById('community-list-container');

  try {
    const res = await fetch('/api/users/me/escrow');
    const result = await handleApiResponse(res);
    if (!result.ok) {
      loader.classList.remove('show');
      if (result.status === 401) {
        renderLoginRequired();
      }
      return;
    }
    const data = result.data;

    let totalSponsored = 0;
    let escrowHolding = 0;
    let totalRefunded = 0;

    donationsContainer.innerHTML = '';
    if (!data.donations || data.donations.length === 0) {
      donationsContainer.innerHTML = '<div class="escrow-empty">참여한 후원 내역이 없습니다.</div>';
    } else {
      data.donations.forEach((d) => {
        if (d.status === 'holding') {
          totalSponsored += d.amount;
          escrowHolding += d.amount;
        } else if (d.status === 'released') {
          totalSponsored += d.amount;
        } else if (d.status === 'refunded') {
          totalRefunded += d.amount;
        }

        const dateStr = new Date(d.createdAt).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });

        let badgeClass = 'badge-holding';
        let statusText = '결제 보관 중';
        let actionButton = '';

        if (d.status === 'released') {
          badgeClass = 'badge-released';
          statusText = '총대 정산 완료';
        } else if (d.status === 'refunded') {
          badgeClass = 'badge-refunded';
          statusText = '환불 완료';
        } else if (d.status === 'holding') {
          if (d.projectStatus === '펀딩 진행 중' || d.projectStatus === '심사 중') {
            actionButton = `<button type="button" class="btn-refund" data-donation-id="${d.id}">환불 신청</button>`;
          }
        }

        donationsContainer.insertAdjacentHTML('beforeend', `
          <div class="escrow-item-card">
            <div class="escrow-item-thumb" style="background:${d.projectGradient}">${d.projectEmoji}</div>
            <div class="escrow-item-details">
              <p class="escrow-item-title">${d.projectTitle}</p>
              <p class="escrow-item-meta">결제수단: ${d.paymentMethod} · 후원일: ${dateStr}</p>
            </div>
            <div class="escrow-item-actions">
              <span class="escrow-item-amount">${formatCurrency(d.amount)}</span>
              <span class="badge ${badgeClass}">${statusText}</span>
              ${actionButton}
            </div>
          </div>
        `);
      });

      donationsContainer.querySelectorAll('.btn-refund').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const donationId = btn.dataset.donationId;
          if (!confirm('정말 이 후원을 취소하고 환불 신청하시겠습니까?')) return;

          loader.classList.add('show');
          document.getElementById('mypage-loading-text').textContent = '환불 처리 중...';

          try {
            const refundRes = await fetch(`/api/donations/${donationId}/refund`, { method: 'POST' });
            const refundResult = await handleApiResponse(refundRes);
            if (!refundResult.ok) {
              loader.classList.remove('show');
              return;
            }
            await loadMypageData();
          } catch (refundErr) {
            showToast(refundErr.message || '환불 처리에 실패했습니다.', 'error');
            loader.classList.remove('show');
          }
        });
      });
    }

    hostedContainer.innerHTML = '';
    if (!data.createdProjects || data.createdProjects.length === 0) {
      hostedContainer.innerHTML = '<div class="escrow-empty">개설 신청한 프로젝트가 없습니다.</div>';
    } else {
      data.createdProjects.forEach((p) => {
        let statusBadgeClass = 'badge-funding';
        if (p.status === '심사 중') statusBadgeClass = 'badge-review';
        if (p.status.includes('무산') || p.status.includes('환불')) statusBadgeClass = 'badge-refunded';

        hostedContainer.insertAdjacentHTML('beforeend', `
          <div class="escrow-item-card">
            <div class="escrow-item-thumb" style="background:${p.gradient}">${p.emoji}</div>
            <div class="escrow-item-details">
              <p class="escrow-item-title"><a href="${projectLink(p.id)}" style="color:inherit;">${p.title}</a></p>
              <p class="escrow-item-meta">카테고리: ${p.category} · 달성률: ${p.percentFunded}%</p>
            </div>
            <div class="escrow-item-actions">
              <span class="escrow-item-amount">${formatCurrency(p.currentAmount)}</span>
              <span class="badge ${statusBadgeClass}">${p.status}</span>
            </div>
          </div>
        `);
      });
    }

    if (communityContainer) {
      communityContainer.innerHTML = '<div class="escrow-empty">커뮤니티 활동 불러오는 중...</div>';
      try {
        const commRes = await fetch('/api/users/me/community');
        const commResult = await handleApiResponse(commRes);
        if (commResult.ok) {
          const { posts, comments } = commResult.data;
          if (!posts.length && !comments.length) {
            communityContainer.innerHTML = '<div class="escrow-empty">작성한 게시글·댓글이 없습니다.</div>';
          } else {
            let html = '';
            if (posts.length) {
              html += '<h4 class="escrow-section-title">내가 쓴 글</h4>';
              posts.forEach((p) => {
                const href = projectLink(p.projectId, { tab: 'community', post: p.id });
                html += `
                  <div class="escrow-item-card">
                    <div class="escrow-item-details">
                      <p class="escrow-item-title"><a href="${href}">${p.projectTitle}</a></p>
                      <p class="escrow-item-meta"><a href="${href}" style="color:inherit;">${p.title || p.body.slice(0, 50)} · ♥ ${p.likeCount}</a></p>
                    </div>
                  </div>`;
              });
            }
            if (comments.length) {
              html += '<h4 class="escrow-section-title" style="margin-top:16px">내가 쓴 댓글</h4>';
              comments.forEach((c) => {
                const href = projectLink(c.projectId, { tab: 'community', post: c.postId });
                html += `
                  <div class="escrow-item-card">
                    <div class="escrow-item-details">
                      <p class="escrow-item-title"><a href="${href}">${c.projectTitle}</a></p>
                      <p class="escrow-item-meta"><a href="${href}" style="color:inherit;">${c.body} · ♥ ${c.likeCount}</a></p>
                    </div>
                  </div>`;
              });
            }
            communityContainer.innerHTML = html;
          }
        } else {
          communityContainer.innerHTML = '<div class="escrow-empty">커뮤니티 활동을 불러오지 못했습니다.</div>';
        }
      } catch {
        communityContainer.innerHTML = '<div class="escrow-empty">커뮤니티 활동을 불러오지 못했습니다.</div>';
      }
    }

    document.getElementById('stat-total-sponsored').textContent = formatCurrency(totalSponsored);
    document.getElementById('stat-escrow-holding').textContent = formatCurrency(escrowHolding);
    document.getElementById('stat-total-refunded').textContent = formatCurrency(totalRefunded);

    loader.classList.remove('show');
  } catch (err) {
    showToast(err.message || '결제·후원 내역을 불러오지 못했습니다.', 'error');
    loader.classList.remove('show');
  }
}

function bindTabHandlers() {
  const tabs = getTabElements();

  tabs.donations.btn.addEventListener('click', () => activateTab('donations'));
  tabs.hosted.btn.addEventListener('click', () => activateTab('hosted'));
  tabs.community.btn.addEventListener('click', () => activateTab('community'));
  tabs.favorites.btn.addEventListener('click', async () => {
    activateTab('favorites');
    await loadFavoritesTab(tabs.favorites.container);
  });
  tabs.history.btn.addEventListener('click', async () => {
    activateTab('history');
    await loadHistoryTab(tabs.history.container);
  });
}

async function initMypage() {
  const authRes = await fetch('/api/auth/me');
  const authData = await authRes.json();

  if (!authData.loggedIn) {
    renderLoginRequired();
    return;
  }

  renderMypageShell();
  document.getElementById('mypage-loading').classList.add('show');
  bindTabHandlers();
  await loadMypageData();

  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  if (tab && MYPAGE_TABS.includes(tab) && tab !== 'donations') {
    activateTab(tab, { updateUrl: false });
    const tabs = getTabElements();
    if (tab === 'favorites') await loadFavoritesTab(tabs.favorites.container);
    if (tab === 'history') await loadHistoryTab(tabs.history.container);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initMypage();
});
