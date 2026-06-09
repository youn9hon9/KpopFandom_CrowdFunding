const API_BASE = '';

function formatCurrency(amount) {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

function getStatusClass(status) {
  if (status === '심사 중') return 'status-badge--review';
  if (status === '심사 거절') return 'status-badge--failed';
  if (status.includes('무산') || status.includes('환불')) return 'status-badge--failed';
  return 'status-badge--funding';
}

function getTrustBarClass(temp) {
  if (temp >= 80) return 'trust-bar--high';
  if (temp >= 60) return 'trust-bar--mid';
  return 'trust-bar--low';
}

function getInitial(name) {
  return name ? name.charAt(0) : '?';
}

function renderNotFound() {
  const root = document.getElementById('detail-root');
  root.innerHTML = `
    <div class="detail-not-found">
      <p class="error-page-code" style="font-size:3rem;margin-bottom:8px;">404</p>
      <h1>프로젝트를 찾을 수 없습니다</h1>
      <p style="margin:16px 0;color:#6b7280">잘못된 링크이거나 삭제된 프로젝트일 수 있습니다.</p>
      <a href="/">메인으로 돌아가기</a>
    </div>
  `;
}

function renderServerError(message) {
  const root = document.getElementById('detail-root');
  root.innerHTML = `
    <div class="detail-server-error">
      <p class="error-page-code" style="font-size:3rem;margin-bottom:8px;">500</p>
      <h1>데이터를 불러오지 못했습니다</h1>
      <p>${message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}</p>
      <button type="button" class="btn btn-primary" onclick="window.location.reload()">다시 시도</button>
      <a href="/" class="btn btn-ghost" style="display:inline-block;margin-left:8px;">메인으로</a>
    </div>
  `;
}

function renderRoleBanner(viewerRole) {
  if (viewerRole === 'host') {
    return '<div class="role-banner role-banner--host">📋 총대 운영 화면 — 후원자에게 보이는 정보와 운영 도구가 함께 표시됩니다.</div>';
  }
  if (viewerRole === 'admin') {
    return `<div class="role-banner role-banner--admin">🛡️ 관리자 보기 — 심사·운영 정보가 포함됩니다. <a href="${window.DuckrowdRoutes ? DuckrowdRoutes.adminUrl() : '/admin'}" style="margin-left:8px;font-weight:700;">심사 콘솔 →</a></div>`;
  }
  if (viewerRole === 'backer') {
    return '<div class="role-banner role-banner--backer">💚 후원자 화면 — 후원 결제 및 환불 정책을 확인하세요.</div>';
  }
  return '';
}

function renderMyDonationBanner(myDonation) {
  if (!myDonation) return '';
  return `
    <div class="my-donation-banner">
      <span>✓ 내 후원: <strong>${formatCurrency(myDonation.amount)}</strong> (${myDonation.paymentMethod})</span>
      <span class="badge badge-holding">보관 중</span>
    </div>
  `;
}

function renderHostPanel(project, hostStats) {
  if (!hostStats) return '';
  return `
    <section class="role-panel role-panel--host">
      <h2 class="role-panel-title">총대 운영 대시보드</h2>
      <div class="host-stats-grid">
        <div class="host-stat-card">
          <p class="host-stat-label">후원자 수</p>
          <p class="host-stat-value">${hostStats.sponsorCount}명</p>
        </div>
        <div class="host-stat-card">
          <p class="host-stat-label">결제 보관 중인 금액</p>
          <p class="host-stat-value">${formatCurrency(hostStats.escrowHolding)}</p>
        </div>
        <div class="host-stat-card">
          <p class="host-stat-label">후원 건수</p>
          <p class="host-stat-value">${hostStats.totalDonations}건</p>
        </div>
      </div>
      ${project.escrowPlan ? `
        <div class="host-escrow-plan">
          <h3>제출한 예산·정산 계획</h3>
          <pre>${project.escrowPlan}</pre>
        </div>
      ` : ''}
      ${project.rejectedReason ? `
        <div class="host-dm-alert host-dm-alert--reject">
          <strong>심사 거절 안내</strong>
          <p>${project.rejectedReason}</p>
        </div>
      ` : ''}
      <div id="host-inbox-panel" class="host-inbox-panel"></div>
      <p class="host-community-hint">공지·일정·투표·게시판 관리는 아래 <strong>커뮤니티</strong> 탭에서 할 수 있습니다.</p>
    </section>
  `;
}

function renderAdminPanel(project) {
  return `
    <section class="role-panel role-panel--admin">
      <h2 class="role-panel-title">관리자 심사 정보</h2>
      <ul class="admin-meta-list">
        <li><span>hostUserId</span><strong>${project.hostUserId || '(샘플/미연결)'}</strong></li>
        <li><span>결제 보관 중인 금액</span><strong>${formatCurrency(project.escrowHolding || 0)}</strong></li>
        <li><span>후원자 수</span><strong>${project.sponsorCount || 0}명</strong></li>
      </ul>
      ${project.escrowPlan ? `<div class="host-escrow-plan"><h3>정산 계획</h3><pre>${project.escrowPlan}</pre></div>` : ''}
      ${project.rejectedReason ? `<p class="admin-reject-reason">거절 사유: ${project.rejectedReason}</p>` : ''}
      ${project.status === '심사 중' ? `
        <a href="${window.DuckrowdRoutes ? DuckrowdRoutes.adminUrl({ projectId: project.id }) : `/admin/projects/${project.id}`}" class="btn btn-primary" style="margin-top:12px;display:inline-block;">심사 콘솔에서 승인/거절 →</a>
      ` : ''}
    </section>
  `;
}

function renderCta(viewerRole, project, myDonation) {
  if (viewerRole === 'host') {
    return `
      <div class="detail-cta detail-cta--host">
        <p class="cta-hint">총대는 본인 프로젝트에 후원할 수 없습니다. 후원자 현황은 위 운영 대시보드에서 확인하세요.</p>
        ${project.status === '심사 중' ? '<span class="status-badge status-badge--review">플랫폼 심사 대기 중</span>' : ''}
      </div>
    `;
  }

  if (viewerRole === 'admin' && project.status === '심사 중') {
    return `
      <div class="detail-cta detail-cta--admin">
        <a href="${window.DuckrowdRoutes ? DuckrowdRoutes.adminUrl({ projectId: project.id }) : `/admin/projects/${project.id}`}" class="btn btn-primary">심사 콘솔에서 승인/거절</a>
      </div>
    `;
  }

  if (project.status === '심사 중' || project.status === '심사 거절') {
    return `
      <div class="detail-cta">
        <p class="cta-hint">${project.status === '심사 거절' ? '심사가 거절된 프로젝트입니다.' : '심사 승인 후 후원이 시작됩니다.'}</p>
      </div>
    `;
  }

  if (myDonation) {
    return `
      <div class="detail-cta">
        <p class="cta-hint">이미 후원 중입니다. 환불은 마이페이지 → 결제·후원 내역에서 신청할 수 있습니다.</p>
        <button type="button" class="btn btn-ghost" id="detail-my-escrow-btn">내 결제·후원 내역 보기</button>
      </div>
    `;
  }

  return `
    <div class="detail-cta" id="detail-sponsor-cta">
      <button type="button" class="btn btn-primary" id="detail-sponsor-btn">이 프로젝트 후원하기</button>
    </div>
  `;
}

function activateDetailTab(tabName, projectId, communityOptions = {}) {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  const btn = Array.from(tabBtns).find((b) => b.dataset.tab === tabName);
  if (!btn) return;

  tabBtns.forEach((b) => b.classList.toggle('active', b === btn));
  panels.forEach((p) => p.classList.toggle('active', p.id === `panel-${tabName}`));

  if (tabName === 'community' && typeof initCommunityPanel === 'function') {
    const opts = { ...getCommunityOptions(), ...communityOptions };
    if (!window._communityLoaded) {
      window._communityLoaded = true;
      initCommunityPanel(projectId, opts);
    } else {
      communityCtx.loggedIn = opts.loggedIn;
      communityCtx.user = opts.user;
      if (communityOptions.activeTab) communityCtx.activeTab = communityOptions.activeTab;
      if (communityOptions.postId) communityCtx.selectedPostId = communityOptions.postId;
      if (typeof refreshCommunityPanel === 'function') refreshCommunityPanel();
    }
  }
}

function initTabs(projectId) {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      activateDetailTab(btn.dataset.tab, projectId);
    });
  });
}

function getCommunityOptions() {
  const auth = window.currentUser || null;
  return {
    loggedIn: Boolean(auth),
    user: auth
  };
}

function bindDetailActions(payload) {
  const { viewerRole, project, myDonation } = payload;
  window.detailContext = payload;

  const sponsorBtn = document.getElementById('detail-sponsor-btn');
  if (sponsorBtn && typeof setupDetailSponsorButton === 'function') {
    setupDetailSponsorButton(project);
  }

  const escrowBtn = document.getElementById('detail-my-escrow-btn');
  if (escrowBtn && typeof showEscrowDashboard === 'function') {
    escrowBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showEscrowDashboard();
    });
  }

  if (viewerRole === 'host') {
    loadHostInboxForProject(project.id);
  }
}

async function loadHostInboxForProject(projectId) {
  const panel = document.getElementById('host-inbox-panel');
  if (!panel) return;
  try {
    const res = await fetch('/api/users/me/host-inbox');
    if (!res.ok) return;
    const data = await res.json();
    const msgs = (data.messages || []).filter((m) => m.projectId === projectId);
    if (!msgs.length) {
      panel.innerHTML = '';
      return;
    }
    panel.innerHTML = `
      <h3 class="host-inbox-title">📩 운영팀 DM (${msgs.length})</h3>
      <ul class="host-inbox-list">
        ${msgs
          .map(
            (m) => `
          <li class="host-inbox-item ${m.read ? '' : 'unread'}">
            <p class="host-inbox-meta">${new Date(m.createdAt).toLocaleString('ko-KR')}</p>
            <p class="host-inbox-body">${String(m.body).replace(/</g, '&lt;')}</p>
          </li>
        `
          )
          .join('')}
      </ul>
    `;
  } catch {
    panel.innerHTML = '';
  }
}

function renderDetail(payload) {
  const { viewerRole, project, myDonation, hostStats } = payload;
  const statusClass = getStatusClass(project.status);
  const barClass = getTrustBarClass(project.trustTemperature);
  const isFailed = project.status.includes('무산') || project.status.includes('환불');

  const root = document.getElementById('detail-root');
  root.innerHTML = `
    <a href="/" class="detail-back">← 목록으로</a>
    ${renderRoleBanner(viewerRole)}
    ${renderMyDonationBanner(myDonation)}

    <div class="detail-hero" style="background:${project.gradient}">
      ${
        project.coverImage
          ? `<img src="${project.coverImage}" alt="" class="detail-hero-img">`
          : `<span class="detail-hero-emoji">${project.emoji}</span>`
      }
    </div>

    <header class="detail-header detail-header--with-fav">
      <div class="detail-header-main">
        <span class="status-badge ${statusClass}">${project.status}</span>
        <h1 class="detail-title">${project.title}</h1>
      </div>
      <button type="button" class="btn-favorite btn-favorite--detail" data-project-id="${project.id}" aria-label="관심 프로젝트" title="관심 프로젝트에 추가">♡</button>
    </header>

    ${viewerRole === 'host' ? renderHostPanel(project, hostStats) : ''}
    ${viewerRole === 'admin' ? renderAdminPanel(project) : ''}

    <div class="detail-host-profile">
      <div class="host-avatar">${getInitial(project.hostName)}</div>
      <div class="host-info">
        <p class="host-name">총대 ${project.hostName}</p>
        <p class="host-success">성공 이력 ${project.successCount ?? 0}회</p>
        <div class="host-trust">
          <span class="trust-temp">🌡️ 덕질 온도 ${project.trustTemperature}도</span>
          <span class="trust-bar-wrap">
            <span class="trust-bar ${barClass}" style="width:${project.trustTemperature}%"></span>
          </span>
        </div>
      </div>
    </div>

    <div class="detail-summary">
      <div class="summary-item">
        <p class="summary-label">목표 금액</p>
        <p class="summary-value">${formatCurrency(project.goalAmount)}</p>
      </div>
      <div class="summary-item">
        <p class="summary-label">현재 모금액</p>
        <p class="summary-value">${formatCurrency(project.currentAmount)}</p>
      </div>
      <div class="summary-item">
        <p class="summary-label">달성률</p>
        <p class="summary-value primary">${project.percentFunded}%</p>
      </div>
      <div class="summary-item">
        <p class="summary-label">남은 기간</p>
        <p class="summary-value">D-${project.daysLeft}일</p>
      </div>
    </div>

    ${renderCta(viewerRole, project, myDonation)}

    <div class="detail-tabs">
      <ul class="tab-list" role="tablist">
        <li><button type="button" class="tab-btn active" data-tab="story" role="tab">펀딩 스토리</button></li>
        <li><button type="button" class="tab-btn" data-tab="community" role="tab">커뮤니티</button></li>
        <li><button type="button" class="tab-btn" data-tab="refund" role="tab">환불 정책</button></li>
      </ul>
    </div>

    <div id="panel-story" class="tab-panel story-content active" role="tabpanel">
      ${project.story}
    </div>

    <div id="panel-community" class="tab-panel community-panel" role="tabpanel">
      <div id="community-root"><p class="community-loading">커뮤니티 탭을 선택하면 내용이 로드됩니다.</p></div>
    </div>

    <div id="panel-refund" class="tab-panel" role="tabpanel">
      ${
        isFailed
          ? `<div class="refund-box refund-box--alert"><strong>무산/자동 환불 예정</strong><br>이 프로젝트는 목표 미달성으로 무산 처리됩니다. 후원금은 별도 신청 없이 자동 환불됩니다.</div>`
          : ''
      }
      <div class="refund-box">
        <h3 style="margin-bottom:12px;font-size:1rem">환불 정책</h3>
        <p>${project.refundPolicy}</p>
      </div>
    </div>
  `;

  window._communityLoaded = false;
  initTabs(project.id);
  bindDetailActions(payload);
}

function initDetailSearch() {
  const input = document.getElementById('detail-search-input');
  if (!input) return;

  const goSearch = () => {
    const q = input.value.trim();
    const url = q ? `/?filter=all&q=${encodeURIComponent(q)}` : '/';
    window.location.href = url;
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      goSearch();
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  initDetailSearch();
  const route = window.DuckrowdRoutes
    ? DuckrowdRoutes.parseProjectRoute()
    : { id: new URLSearchParams(window.location.search).get('id') };
  const id = route?.id;

  if (!id) {
    renderNotFound();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/projects/${id}`);

    if (res.status === 404) {
      renderNotFound();
      return;
    }

    if (!res.ok) {
      const message = typeof parseApiError === 'function'
        ? await parseApiError(res)
        : '요청 처리에 실패했습니다.';
      if (res.status >= 500) {
        renderServerError(message);
      } else {
        if (typeof showToast === 'function') showToast(message, 'error');
        renderNotFound();
      }
      return;
    }

    const payload = await res.json();
    document.title = `${payload.project.title} — Duckrowd`;
    renderDetail(payload);
    if (window.UserActivity) {
      window.UserActivity.saveViewHistory(payload.project);
    }

    const tabParam = route.tab;
    const postParam = route.post;
    if (tabParam === 'community') {
      activateDetailTab('community', payload.project.id, {
        activeTab: postParam ? 'posts' : 'all',
        postId: postParam || null
      });
    }

    if (typeof checkLoginStatus === 'function') {
      await checkLoginStatus();
      if (window._communityLoaded && typeof refreshCommunityPanel === 'function') {
        communityCtx.loggedIn = Boolean(window.currentUser);
        communityCtx.user = window.currentUser;
        refreshCommunityPanel();
      }
    }

    if (window.FavoriteStore) {
      if (!window.FavoriteStore.loaded) await window.FavoriteStore.load();
      window.FavoriteStore.bindButtons(document.getElementById('detail-root'));
    }
  } catch (err) {
    console.error(err);
    renderServerError('네트워크 오류가 발생했습니다. 서버가 실행 중인지 확인해주세요.');
  }
});
