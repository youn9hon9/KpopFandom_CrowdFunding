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

function getInitial(name) {
  return name ? name.charAt(0) : '?';
}

function renderNotFound() {
  const root = document.getElementById('detail-root');
  root.innerHTML = `
    <div class="detail-not-found">
      <h1>프로젝트를 찾을 수 없습니다</h1>
      <p style="margin:16px 0;color:#6b7280">잘못된 링크이거나 삭제된 프로젝트일 수 있습니다.</p>
      <a href="/">메인으로 돌아가기</a>
    </div>
  `;
}

function renderNotices(notices) {
  if (!notices || !notices.length) {
    return '<p style="color:#6b7280">등록된 공지가 없습니다.</p>';
  }
  return `
    <h3 style="margin-bottom:16px;font-size:1rem">공지</h3>
    <ul class="notice-list">
      ${notices
        .map(
          (n) => `
        <li class="notice-item">
          <p class="notice-date">${n.date}</p>
          <p class="notice-title">${n.title}</p>
          <p class="notice-body">${n.body}</p>
        </li>
      `
        )
        .join('')}
    </ul>
  `;
}

function renderPolls(polls) {
  if (!polls || !polls.length) {
    return '<p style="color:#6b7280;margin-top:24px">진행 중인 투표가 없습니다.</p>';
  }

  return polls
    .map((poll, pollIndex) => {
      const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
      const optionsHtml = poll.options
        .map(
          (opt, optIndex) => `
        <li class="poll-option">
          <label>
            <input type="radio" name="poll-${pollIndex}" value="${optIndex}">
            ${opt.label}
          </label>
        </li>
      `
        )
        .join('');

      const resultsHtml = poll.options
        .map((opt) => {
          const pct = totalVotes ? Math.round((opt.votes / totalVotes) * 100) : 0;
          return `
          <div class="poll-result-row">
            <div class="poll-result-label"><span>${opt.label}</span><span>${pct}% (${opt.votes}표)</span></div>
            <div class="poll-result-bar"><div class="poll-result-fill" style="width:${pct}%"></div></div>
          </div>
        `;
        })
        .join('');

      return `
        <div class="poll-block" data-poll-index="${pollIndex}">
          <p class="poll-question">${poll.question}</p>
          <form class="poll-vote-form">
            <ul class="poll-options">${optionsHtml}</ul>
            <button type="submit" class="btn btn-primary" style="margin-top:12px">투표하기</button>
          </form>
          <div class="poll-results">${resultsHtml}</div>
        </div>
      `;
    })
    .join('');
}

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach((b) => b.classList.toggle('active', b === btn));
      panels.forEach((p) => p.classList.toggle('active', p.id === `panel-${target}`));
    });
  });
}

function initPollVoting() {
  document.querySelectorAll('.poll-block').forEach((block) => {
    const form = block.querySelector('.poll-vote-form');
    const results = block.querySelector('.poll-results');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const selected = form.querySelector('input[type="radio"]:checked');
      if (!selected) {
        alert('항목을 선택해주세요.');
        return;
      }
      form.classList.add('hidden');
      results.classList.add('visible');
    });
  });
}

function initDemoButtons() {
  document.querySelectorAll('[data-demo]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      alert('데모 기능입니다. 시연용 MVP에서는 실제 동작하지 않습니다.');
    });
  });
}

function renderDetail(project) {
  const statusClass = getStatusClass(project.status);
  const barClass = getTrustBarClass(project.trustTemperature);
  const isFailed = project.status.includes('무산') || project.status.includes('환불');

  const root = document.getElementById('detail-root');
  root.innerHTML = `
    <a href="/" class="detail-back">← 목록으로</a>

    <div class="detail-hero" style="background:${project.gradient}">
      <span class="detail-hero-emoji">${project.emoji}</span>
    </div>

    <header class="detail-header">
      <span class="status-badge ${statusClass}">${project.status}</span>
      <h1 class="detail-title">${project.title}</h1>
    </header>

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

    <div class="detail-cta">
      <button type="button" class="btn btn-primary" data-demo>이 프로젝트 후원하기</button>
    </div>

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

    <div id="panel-community" class="tab-panel" role="tabpanel">
      ${renderNotices(project.community?.notices)}
      <h3 style="margin-bottom:16px;font-size:1rem">투표</h3>
      ${renderPolls(project.community?.polls)}
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

  initTabs();
  initPollVoting();
  initDemoButtons();
}

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    renderNotFound();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/projects/${id}`);
    if (!res.ok) {
      renderNotFound();
      return;
    }
    const project = await res.json();
    document.title = `${project.title} — Duckrowd`;
    renderDetail(project);
  } catch (err) {
    console.error(err);
    renderNotFound();
  }
});
