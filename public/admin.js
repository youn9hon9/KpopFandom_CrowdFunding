const API_BASE = '';

function formatCurrency(amount) {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderForbidden() {
  document.getElementById('admin-root').innerHTML = `
    <div class="admin-forbidden">
      <p class="error-page-code" style="font-size:3rem;">403</p>
      <h1>관리자 권한이 필요합니다</h1>
      <p>Google 계정 <strong>dodamm111</strong> 등 <code>ADMIN_IDENTIFIERS</code>에 등록된 계정으로 로그인해 주세요.</p>
      <a href="/?login=1" class="btn btn-primary">로그인하기</a>
    </div>
  `;
}

function adminHref(opts) {
  return window.DuckrowdRoutes ? DuckrowdRoutes.adminUrl(opts) : '/admin';
}

function renderAdminNav(active) {
  return `
    <nav class="admin-nav">
      <a href="${adminHref()}" class="admin-nav-link ${active === 'pending' ? 'active' : ''}">심사 대기</a>
      <a href="${adminHref({ view: 'all' })}" class="admin-nav-link ${active === 'all' ? 'active' : ''}">전체 프로젝트</a>
      <a href="/api/admin/export/donations.csv" class="admin-nav-link admin-nav-export" download>후원 CSV</a>
    </nav>
  `;
}

function renderReviewDetail(project) {
  const root = document.getElementById('admin-root');
  root.innerHTML = `
    <a href="${adminHref()}" class="detail-back">← 심사 대기 목록</a>
    ${renderAdminNav('pending')}
    <div class="role-banner role-banner--admin">🛡️ 관리자 모드 — 심사·운영 콘솔</div>

    <header class="detail-header" style="margin-top:16px;">
      <span class="status-badge status-badge--review">${project.status}</span>
      <h1 class="detail-title">${project.title}</h1>
    </header>

    <div class="admin-review-grid">
      <section class="admin-card">
        <h2>프로젝트 정보</h2>
        <ul class="admin-meta-list">
          <li><span>카테고리</span><strong>${project.category}</strong></li>
          <li><span>총대</span><strong>${project.hostName}</strong></li>
          <li><span>hostUserId</span><strong>${project.hostUserId || '(미연결)'}</strong></li>
          <li><span>목표 금액</span><strong>${formatCurrency(project.goalAmount)}</strong></li>
          <li><span>신청일</span><strong>${formatDate(project.submittedAt)}</strong></li>
        </ul>
      </section>

      <section class="admin-card">
        <h2>예산·정산 계획</h2>
        <pre class="admin-escrow-plan">${project.escrowPlan || '제출된 정산 계획이 없습니다.'}</pre>
      </section>

      <section class="admin-card admin-card--wide">
        <h2>펀딩 스토리</h2>
        <div class="story-content">${project.story}</div>
      </section>

      <section class="admin-card admin-card--wide">
        <h2>심사 결정</h2>
        <p class="admin-hint">승인·거절 시 총대에게 <strong>운영팀 DM(공지)</strong>이 자동 발송됩니다. 거절 시 사유가 메시지에 포함됩니다.</p>
        <div class="admin-review-actions">
          <button type="button" class="btn btn-primary" id="btn-approve">✓ 심사 승인</button>
          <button type="button" class="btn btn-ghost btn-danger-outline" id="btn-reject">✕ 심사 거절</button>
        </div>
        <div class="form-group" style="margin-top:16px;">
          <label class="form-label" for="reject-reason">거절 사유 (거절 시 필수 · 총대 DM에 포함)</label>
          <textarea id="reject-reason" class="form-input" style="height:100px;resize:vertical;" placeholder="예: 예산·정산 계획이 불충분합니다. 구체적인 단계별 금액을 보완해 주세요."></textarea>
        </div>
      </section>

      <section class="admin-card admin-card--wide">
        <h2>총대에게 DM 보내기</h2>
        <form id="dm-form" class="admin-dm-form">
          <textarea id="dm-message" class="form-input" rows="4" placeholder="총대에게 전달할 운영 메시지를 입력하세요." required></textarea>
          <button type="submit" class="btn btn-primary btn-sm" style="margin-top:10px;">DM 발송</button>
        </form>
      </section>

      <section class="admin-card admin-card--wide admin-card--danger">
        <h2>위험 구역</h2>
        <p class="admin-hint">프로젝트를 영구 삭제합니다. 보관 중인 후원이 있으면 삭제할 수 없습니다.</p>
        <button type="button" class="btn btn-ghost btn-danger-outline" id="btn-delete-project">프로젝트 삭제</button>
      </section>
    </div>
  `;

  document.getElementById('btn-approve').addEventListener('click', () => submitReview(project.id, 'approve'));
  document.getElementById('btn-reject').addEventListener('click', () => submitReview(project.id, 'reject'));
  document.getElementById('dm-form').addEventListener('submit', (e) => sendDm(e, project.id));
  document.getElementById('btn-delete-project').addEventListener('click', () => deleteProject(project.id, project.title));
}

function renderProjectList(projects, title, hint) {
  const listHtml = projects.length
    ? projects
        .map(
          (p) => `
      <div class="admin-list-item-wrap">
        <a href="${adminHref({ projectId: p.id })}" class="admin-list-item">
          <span class="admin-list-emoji" style="background:${p.gradient}">${p.emoji}</span>
          <div class="admin-list-body">
            <p class="admin-list-title">${p.title}</p>
            <p class="admin-list-meta">총대 ${p.hostName} · ${p.category} · ${formatCurrency(p.goalAmount)}</p>
            ${p.rejectedReason ? `<p class="admin-list-reject">거절: ${p.rejectedReason}</p>` : ''}
          </div>
          <span class="status-badge ${p.status === '심사 중' ? 'status-badge--review' : p.status === '심사 거절' ? 'status-badge--failed' : 'status-badge--funding'}">${p.status}</span>
        </a>
        <div class="admin-list-actions">
          <button type="button" class="btn btn-ghost btn-xs btn-quick-dm" data-id="${p.id}" data-title="${p.title.replace(/"/g, '&quot;')}">DM</button>
          <button type="button" class="btn btn-ghost btn-xs btn-danger-outline btn-quick-del" data-id="${p.id}" data-title="${p.title.replace(/"/g, '&quot;')}">삭제</button>
        </div>
      </div>
    `
        )
        .join('')
    : '<div class="escrow-empty">표시할 프로젝트가 없습니다.</div>';

  return `
    <h2 class="section-title" style="margin:20px 0 8px;">${title}</h2>
    ${hint ? `<p class="admin-hint" style="margin-bottom:16px;">${hint}</p>` : ''}
    <div class="admin-list">${listHtml}</div>
  `;
}

function renderDashboard(overview) {
  const root = document.getElementById('admin-root');
  const view = new URLSearchParams(window.location.search).get('view');

  if (view === 'all') {
    root.innerHTML = `
      ${renderAdminNav('all')}
      <div class="role-banner role-banner--admin">🛡️ 관리자 모드 — 전체 프로젝트</div>
      <div class="admin-stats-row">
        <div class="admin-stat"><span>전체</span><strong>${overview.stats.totalCount}</strong></div>
        <div class="admin-stat"><span>심사 대기</span><strong>${overview.stats.pendingCount}</strong></div>
        <div class="admin-stat"><span>펀딩 중</span><strong>${overview.stats.fundingCount}</strong></div>
        <div class="admin-stat"><span>거절</span><strong>${overview.stats.rejectedCount}</strong></div>
      </div>
      <div id="all-projects-list"><p class="loading">불러오는 중...</p></div>
    `;
    loadAllProjects();
    return;
  }

  root.innerHTML = `
    ${renderAdminNav('pending')}
    <div class="role-banner role-banner--admin">🛡️ 관리자 모드 — 심사 대기 (${overview.stats.pendingCount}건)</div>
    <div class="admin-stats-row">
      <div class="admin-stat admin-stat--highlight"><span>심사 대기</span><strong>${overview.stats.pendingCount}</strong></div>
      <div class="admin-stat"><span>펀딩 진행</span><strong>${overview.stats.fundingCount}</strong></div>
      <div class="admin-stat"><span>거절</span><strong>${overview.stats.rejectedCount}</strong></div>
    </div>
    ${renderProjectList(overview.pending, '심사 신청 대기 목록', '신청된 프로젝트를 선택해 승인·거절하거나 총대에게 DM을 보내세요.')}
    ${
      overview.recentRejected.length
        ? renderProjectList(overview.recentRejected, '최근 거절', '거절 사유는 각 항목 또는 상세에서 확인할 수 있습니다.')
        : ''
    }
  `;

  bindListActions();
}

function bindListActions() {
  document.querySelectorAll('.btn-quick-dm').forEach((btn) => {
    btn.addEventListener('click', () => {
      const msg = prompt(`「${btn.dataset.title}」 총대에게 보낼 메시지:`);
      if (!msg?.trim()) return;
      sendDmQuick(btn.dataset.id, msg.trim());
    });
  });
  document.querySelectorAll('.btn-quick-del').forEach((btn) => {
    btn.addEventListener('click', () => deleteProject(btn.dataset.id, btn.dataset.title));
  });
}

async function loadAllProjects() {
  const res = await fetch(`${API_BASE}/api/admin/projects`);
  const result = await handleApiResponse(res);
  if (!result.ok) return;
  document.getElementById('all-projects-list').innerHTML = renderProjectList(
    result.data.projects,
    '전체 프로젝트',
    ''
  );
  bindListActions();
}

async function submitReview(projectId, action) {
  const reasonEl = document.getElementById('reject-reason');
  const reason = reasonEl ? reasonEl.value.trim() : '';

  if (action === 'reject' && !reason) {
    showToast('거절 사유를 입력해 주세요. 총대 DM에 포함됩니다.', 'warning');
    return;
  }

  if (!confirm(action === 'approve' ? '승인하고 총대에게 안내 DM을 보낼까요?' : '거절하고 사유를 총대에게 DM으로 보낼까요?')) {
    return;
  }

  const res = await fetch(`${API_BASE}/api/admin/projects/${projectId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, reason })
  });

  const result = await handleApiResponse(res);
  if (!result.ok) return;

  showToast(action === 'approve' ? '심사 승인 및 DM 발송 완료' : '심사 거절 및 DM 발송 완료', 'success');
  setTimeout(() => { window.location.href = adminHref(); }, 1200);
}

async function sendDm(e, projectId) {
  e.preventDefault();
  const message = document.getElementById('dm-message').value.trim();
  if (!message) return;

  const res = await fetch(`${API_BASE}/api/admin/projects/${projectId}/dm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  const result = await handleApiResponse(res);
  if (!result.ok) return;
  showToast('총대에게 DM이 발송되었습니다.', 'success');
  document.getElementById('dm-message').value = '';
}

async function sendDmQuick(projectId, message) {
  const res = await fetch(`${API_BASE}/api/admin/projects/${projectId}/dm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  const result = await handleApiResponse(res);
  if (!result.ok) return;
  showToast('DM 발송 완료', 'success');
}

async function deleteProject(projectId, title) {
  if (!confirm(`「${title}」 프로젝트를 영구 삭제하시겠습니까?`)) return;

  const res = await fetch(`${API_BASE}/api/admin/projects/${projectId}`, { method: 'DELETE' });
  const result = await handleApiResponse(res);
  if (!result.ok) return;
  showToast('프로젝트가 삭제되었습니다.', 'success');
  setTimeout(() => { window.location.href = adminHref(); }, 1000);
}

document.addEventListener('DOMContentLoaded', async () => {
  const adminRoute = window.DuckrowdRoutes
    ? DuckrowdRoutes.parseAdminRoute()
    : { projectId: new URLSearchParams(window.location.search).get('id'), view: null };
  const projectId = adminRoute.projectId;

  try {
    const authRes = await fetch('/api/auth/me');
    const authData = await authRes.json();

    if (!authData.loggedIn || authData.user?.role !== 'admin') {
      renderForbidden();
      return;
    }

    if (projectId) {
      const res = await fetch(`${API_BASE}/api/admin/projects/${projectId}`);
      const result = await handleApiResponse(res);
      if (!result.ok) {
        if (result.status === 403) renderForbidden();
        return;
      }
      renderReviewDetail(result.data.project);
    } else {
      const res = await fetch(`${API_BASE}/api/admin/overview`);
      const result = await handleApiResponse(res);
      if (!result.ok) {
        if (result.status === 403) renderForbidden();
        return;
      }
      renderDashboard(result.data);
    }
  } catch (err) {
    console.error(err);
    showToast('관리자 콘솔을 불러오지 못했습니다.', 'error');
  }
});
