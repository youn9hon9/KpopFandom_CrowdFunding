let communityCtx = {
  projectId: null,
  canManage: false,
  loggedIn: false,
  user: null,
  activeTab: 'all',
  selectedPostId: null,
  editingPostId: null,
  editingCommentId: null,
  data: null
};

function canEditContent(item) {
  return (
    communityCtx.canManage ||
    (communityCtx.user && item?.authorUserId === communityCtx.user.id)
  );
}

function formatCommunityDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function communityFetch(path, options = {}) {
  const res = await fetch(`/api/projects/${communityCtx.projectId}${path}`, options);
  return typeof handleApiResponse === 'function' ? handleApiResponse(res) : { ok: res.ok, data: await res.json() };
}

async function loadCommunityData() {
  const res = await fetch(`/api/projects/${communityCtx.projectId}/community`);
  if (!res.ok) {
    const msg = typeof parseApiError === 'function' ? await parseApiError(res) : '커뮤니티를 불러오지 못했습니다.';
    document.getElementById('community-root').innerHTML = `<p class="community-empty">${escapeHtml(msg)}</p>`;
    return;
  }
  communityCtx.data = await res.json();
  communityCtx.canManage = communityCtx.data.canManage;
  renderCommunityPanel();
}

function renderHostComposeForms() {
  if (!communityCtx.canManage) return '';

  return `
    <details class="community-compose host-compose">
      <summary>총대 · 관리자 작성 도구</summary>
      <div class="compose-grid">
        <form id="form-notice" class="compose-card">
          <h4>공지 등록</h4>
          <input type="text" name="title" class="form-input" placeholder="공지 제목" required>
          <textarea name="body" class="form-input" rows="3" placeholder="공지 내용" required></textarea>
          <label class="compose-check"><input type="checkbox" name="pinned"> 상단 고정</label>
          <button type="submit" class="btn btn-primary btn-sm">공지 올리기</button>
        </form>
        <form id="form-schedule" class="compose-card">
          <h4>일정 등록</h4>
          <input type="text" name="title" class="form-input" placeholder="일정 제목" required>
          <input type="date" name="eventDate" class="form-input" required>
          <input type="time" name="eventTime" class="form-input">
          <input type="text" name="location" class="form-input" placeholder="장소 (카카오맵 검색, 예: 홍대입구역 2호선)">
          <textarea name="description" class="form-input" rows="2" placeholder="설명"></textarea>
          <button type="submit" class="btn btn-primary btn-sm">일정 추가</button>
        </form>
        <form id="form-poll" class="compose-card">
          <h4>투표 만들기</h4>
          <input type="text" name="question" class="form-input" placeholder="투표 질문" required>
          <input type="text" name="opt1" class="form-input" placeholder="선택지 1" required>
          <input type="text" name="opt2" class="form-input" placeholder="선택지 2" required>
          <input type="text" name="opt3" class="form-input" placeholder="선택지 3 (선택)">
          <button type="submit" class="btn btn-primary btn-sm">투표 개설</button>
        </form>
      </div>
    </details>
  `;
}

function renderPostCompose() {
  if (!communityCtx.loggedIn) {
    return '<p class="community-login-hint">게시글·댓글·좋아요·투표는 <button type="button" class="btn-link" id="community-login-btn">로그인</button> 후 이용할 수 있습니다.</p>';
  }
  return `
    <form id="form-post" class="compose-card post-compose">
      <h4>게시글 작성</h4>
      <input type="text" name="title" class="form-input" placeholder="제목 (선택)">
      <textarea name="body" class="form-input" rows="3" placeholder="후원자·팬들과 소통해 보세요" required></textarea>
      <button type="submit" class="btn btn-primary btn-sm">게시하기</button>
    </form>
  `;
}

function renderNoticesSection(notices) {
  if (!notices.length) return '<p class="community-empty">등록된 공지가 없습니다.</p>';
  const sorted = [...notices].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
  return `
    <ul class="notice-list">
      ${sorted
        .map(
          (n) => `
        <li class="notice-item" data-id="${n.id}">
          ${n.pinned ? '<span class="badge badge-pinned">고정</span>' : ''}
          <p class="notice-meta">${escapeHtml(n.date)} · ${escapeHtml(n.authorName)}</p>
          <p class="notice-title">${escapeHtml(n.title)}</p>
          <p class="notice-body">${escapeHtml(n.body)}</p>
          ${communityCtx.canManage || (communityCtx.user && n.authorUserId === communityCtx.user.id) ? `<button type="button" class="btn btn-ghost btn-xs btn-del" data-type="notice" data-id="${n.id}">삭제</button>` : ''}
        </li>
      `
        )
        .join('')}
    </ul>
  `;
}

function renderSchedulesSection(schedules) {
  if (!schedules.length) return '<p class="community-empty">등록된 일정이 없습니다.</p>';
  return `
    <ul class="schedule-list">
      ${schedules
        .map(
          (s) => `
        <li class="schedule-item" data-id="${s.id}">
          <div class="schedule-date">${escapeHtml(s.eventDate)} ${s.eventTime ? escapeHtml(s.eventTime) : ''}</div>
          <p class="schedule-title">${escapeHtml(s.title)}</p>
          ${
            s.location
              ? `
            <p class="schedule-loc">
              <a href="${escapeHtml(s.mapUrl || `https://map.kakao.com/link/search/${encodeURIComponent(s.location)}`)}" target="_blank" rel="noopener noreferrer">📍 ${escapeHtml(s.location)}</a>
            </p>
            <div class="schedule-map-wrap">
              <div class="schedule-map"
                data-lat="${s.mapLat ?? ''}"
                data-lng="${s.mapLng ?? ''}"
                data-location="${escapeHtml(s.location)}"
                data-label="${escapeHtml(s.mapPlaceName || s.title)}"></div>
            </div>
          `
              : ''
          }
          ${s.description ? `<p class="schedule-desc">${escapeHtml(s.description)}</p>` : ''}
          ${communityCtx.canManage ? `<button type="button" class="btn btn-ghost btn-xs btn-del" data-type="schedule" data-id="${s.id}">삭제</button>` : ''}
        </li>
      `
        )
        .join('')}
    </ul>
  `;
}

function renderPollsSection(polls) {
  if (!polls.length) return '<p class="community-empty">진행 중인 투표가 없습니다.</p>';
  return polls
    .map((poll) => {
      const resultsHtml = poll.options
        .map(
          (opt, idx) => `
        <div class="poll-result-row">
          <div class="poll-result-label"><span>${escapeHtml(opt.label)}</span><span>${opt.percent}% (${opt.votes}표)</span></div>
          <div class="poll-result-bar"><div class="poll-result-fill" style="width:${opt.percent}%"></div></div>
        </div>
      `
        )
        .join('');

      if (poll.hasVoted || !communityCtx.loggedIn) {
        return `
          <div class="poll-block" data-poll-id="${poll.id}">
            <p class="poll-question">${escapeHtml(poll.question)}</p>
            <div class="poll-results visible">${resultsHtml}</div>
            <p class="poll-meta">${poll.totalVotes}명 참여${poll.hasVoted ? ' · 내 선택 반영됨' : ''}</p>
            ${communityCtx.canManage ? `<button type="button" class="btn btn-ghost btn-xs btn-del" data-type="poll" data-id="${poll.id}">삭제</button>` : ''}
          </div>
        `;
      }

      const optionsHtml = poll.options
        .map(
          (opt, idx) => `
        <li class="poll-option">
          <label><input type="radio" name="poll-${poll.id}" value="${idx}"> ${escapeHtml(opt.label)}</label>
        </li>
      `
        )
        .join('');

      return `
        <div class="poll-block" data-poll-id="${poll.id}">
          <p class="poll-question">${escapeHtml(poll.question)}</p>
          <form class="poll-vote-form" data-poll-id="${poll.id}">
            <ul class="poll-options">${optionsHtml}</ul>
            <button type="submit" class="btn btn-primary btn-sm">투표하기</button>
          </form>
          <div class="poll-results">${resultsHtml}</div>
          ${communityCtx.canManage ? `<button type="button" class="btn btn-ghost btn-xs btn-del" data-type="poll" data-id="${poll.id}">삭제</button>` : ''}
        </div>
      `;
    })
    .join('');
}

function postExcerpt(body, max = 80) {
  const text = String(body || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function findPostById(postId) {
  return communityCtx.data?.community?.posts?.find((p) => p.id === postId) || null;
}

function syncCommunityPostUrl(postId) {
  const projectId = communityCtx.projectId;
  if (projectId && window.DuckrowdRoutes) {
    const nextUrl = postId
      ? DuckrowdRoutes.projectUrl(projectId, { post: postId })
      : DuckrowdRoutes.projectUrl(projectId, { tab: 'community' });
    history.replaceState(null, '', nextUrl);
    return;
  }

  const url = new URL(window.location.href);
  if (postId) {
    url.searchParams.set('tab', 'community');
    url.searchParams.set('post', postId);
  } else {
    url.searchParams.delete('post');
    if (url.searchParams.get('tab') === 'community' && !url.pathname.includes('/posts/')) {
      url.searchParams.delete('tab');
    }
  }
  history.replaceState(null, '', url);
}

function openPostDetail(postId) {
  communityCtx.selectedPostId = postId;
  if (communityCtx.activeTab === 'mine') communityCtx.activeTab = 'posts';
  syncCommunityPostUrl(postId);
  renderCommunityPanel();
}

function closePostDetail() {
  communityCtx.selectedPostId = null;
  syncCommunityPostUrl(null);
  renderCommunityPanel();
}

function renderPostDetailView(post) {
  const canDelete = canEditContent(post);
  const isEditing = communityCtx.editingPostId === post.id;
  const bodyBlock = isEditing
    ? `
        <form class="edit-form post-edit-form" data-post-id="${post.id}">
          <input type="text" name="title" class="form-input" placeholder="제목 (선택)" value="${escapeHtml(post.title || '')}">
          <textarea name="body" class="form-input" rows="4" required>${escapeHtml(post.body)}</textarea>
          <div class="edit-form-actions">
            <button type="submit" class="btn btn-primary btn-sm">저장</button>
            <button type="button" class="btn btn-ghost btn-sm btn-cancel-edit" data-type="post">취소</button>
          </div>
        </form>
      `
    : `
        ${post.title ? `<h3 class="post-title">${escapeHtml(post.title)}</h3>` : ''}
        <p class="post-body">${escapeHtml(post.body)}</p>
      `;
  return `
    <div class="post-detail">
      <button type="button" class="btn btn-ghost btn-sm post-detail-back" id="post-detail-back">← 게시글 목록</button>
      <article class="post-item post-item--detail" data-post-id="${post.id}">
        <div class="post-header">
          <strong>${escapeHtml(post.authorName)}</strong>
          <span class="post-date">${formatCommunityDate(post.createdAt)}${post.updatedAt ? ' · 수정됨' : ''}</span>
        </div>
        ${bodyBlock}
        <div class="post-actions">
          <button type="button" class="btn-like ${post.likedByMe ? 'active' : ''}" data-type="post" data-id="${post.id}">
            ♥ ${post.likeCount}
          </button>
          <span class="post-comment-count">💬 ${post.comments.length}</span>
          ${canDelete && !isEditing ? `<button type="button" class="btn btn-ghost btn-xs btn-edit" data-type="post" data-id="${post.id}">수정</button>` : ''}
          ${canDelete ? `<button type="button" class="btn btn-ghost btn-xs btn-del" data-type="post" data-id="${post.id}">삭제</button>` : ''}
        </div>
        <ul class="comment-list">
          ${post.comments.map((c) => renderCommentItem(c, post.id)).join('')}
        </ul>
        ${
          communityCtx.loggedIn
            ? `
          <form class="comment-form" data-post-id="${post.id}">
            <input type="text" name="body" class="form-input" placeholder="댓글을 입력하세요" required>
            <button type="submit" class="btn btn-primary btn-sm">등록</button>
          </form>
        `
            : ''
        }
      </article>
    </div>
  `;
}

function renderPostsSection(posts) {
  if (communityCtx.selectedPostId) {
    const post = findPostById(communityCtx.selectedPostId);
    if (post) return renderPostDetailView(post);
    communityCtx.selectedPostId = null;
  }

  if (!posts.length) return '<p class="community-empty">아직 게시글이 없습니다. 첫 글을 남겨 보세요!</p>';
  return `
    <ul class="post-list post-list--preview">
      ${posts.map((post) => renderPostPreviewItem(post)).join('')}
    </ul>
  `;
}

function renderPostPreviewItem(post) {
  return `
    <li class="post-item post-item--preview" data-post-id="${post.id}">
      <button type="button" class="post-preview-link" data-post-id="${post.id}">
        <div class="post-preview-header">
          <strong>${escapeHtml(post.authorName)}</strong>
          <span class="post-date">${formatCommunityDate(post.createdAt)}</span>
        </div>
        ${post.title ? `<p class="post-preview-title">${escapeHtml(post.title)}</p>` : ''}
        <p class="post-preview-excerpt">${escapeHtml(postExcerpt(post.body))}</p>
        <div class="post-preview-meta">
          <span>♥ ${post.likeCount}</span>
          <span>💬 ${post.comments.length}</span>
          <span class="post-preview-more">자세히 보기 →</span>
        </div>
      </button>
    </li>
  `;
}

function renderCommentItem(comment, postId) {
  const canDelete = canEditContent(comment);
  const isEditing = communityCtx.editingCommentId === comment.id;
  const bodyBlock = isEditing
    ? `
        <form class="edit-form comment-edit-form" data-comment-id="${comment.id}">
          <input type="text" name="body" class="form-input" value="${escapeHtml(comment.body)}" required>
          <div class="edit-form-actions">
            <button type="submit" class="btn btn-primary btn-sm">저장</button>
            <button type="button" class="btn btn-ghost btn-sm btn-cancel-edit" data-type="comment">취소</button>
          </div>
        </form>
      `
    : `<p class="comment-body">${escapeHtml(comment.body)}</p>`;
  return `
    <li class="comment-item" data-comment-id="${comment.id}">
      <span class="comment-author">${escapeHtml(comment.authorName)}</span>
      <span class="comment-date">${formatCommunityDate(comment.createdAt)}${comment.updatedAt ? ' · 수정됨' : ''}</span>
      ${bodyBlock}
      <div class="comment-actions">
        <button type="button" class="btn-like ${comment.likedByMe ? 'active' : ''}" data-type="comment" data-id="${comment.id}">
          ♥ ${comment.likeCount}
        </button>
        ${canDelete && !isEditing ? `<button type="button" class="btn btn-ghost btn-xs btn-edit" data-type="comment" data-id="${comment.id}">수정</button>` : ''}
        ${canDelete ? `<button type="button" class="btn btn-ghost btn-xs btn-del" data-type="comment" data-id="${comment.id}">삭제</button>` : ''}
      </div>
    </li>
  `;
}

function renderMyActivitySection() {
  const { myActivity } = communityCtx.data;
  if (!communityCtx.loggedIn) {
    return '<p class="community-empty">로그인하면 이 프로젝트에서 작성한 글·댓글을 볼 수 있습니다.</p>';
  }
  const { posts, comments } = myActivity;
  if (!posts.length && !comments.length) {
    return '<p class="community-empty">아직 작성한 글·댓글이 없습니다.</p>';
  }
  return `
    <div class="my-activity">
      <h4>내가 쓴 글 (${posts.length})</h4>
      ${
        posts.length
          ? `<ul class="activity-list">${posts
              .map(
                (p) => `
          <li>
            <button type="button" class="activity-link" data-post-id="${p.id}">
              <strong>${escapeHtml(p.title || p.body.slice(0, 30))}</strong>
              <span>${formatCommunityDate(p.createdAt)} · ♥ ${p.likeCount}</span>
            </button>
          </li>
        `
              )
              .join('')}</ul>`
          : '<p class="community-empty">없음</p>'
      }
      <h4 style="margin-top:20px">내가 쓴 댓글 (${comments.length})</h4>
      ${
        comments.length
          ? `<ul class="activity-list">${comments
              .map(
                (c) => `
          <li>
            <button type="button" class="activity-link" data-post-id="${c.postId}">
              <span class="activity-comment-body">${escapeHtml(c.body)}</span>
              <span>${formatCommunityDate(c.createdAt)} · ♥ ${c.likeCount}</span>
            </button>
          </li>
        `
              )
              .join('')}</ul>`
          : '<p class="community-empty">없음</p>'
      }
    </div>
  `;
}

function renderCommunityContent() {
  const { community } = communityCtx.data;
  const tab = communityCtx.activeTab;

  if (tab === 'notices') return renderNoticesSection(community.notices);
  if (tab === 'schedules') return renderSchedulesSection(community.schedules);
  if (tab === 'polls') return renderPollsSection(community.polls);
  if (tab === 'posts') return renderPostCompose() + renderPostsSection(community.posts);
  if (tab === 'mine') return renderMyActivitySection();

  return `
    ${renderHostComposeForms()}
    ${tab === 'all' || tab === 'posts' ? renderPostCompose() : ''}
    <section class="community-section">
      <h3 class="community-section-title">📢 공지</h3>
      ${renderNoticesSection(community.notices)}
    </section>
    <section class="community-section">
      <h3 class="community-section-title">📅 일정</h3>
      ${renderSchedulesSection(community.schedules)}
    </section>
    <section class="community-section">
      <h3 class="community-section-title">🗳️ 투표</h3>
      ${renderPollsSection(community.polls)}
    </section>
    <section class="community-section">
      <h3 class="community-section-title">💬 게시판</h3>
      ${renderPostsSection(community.posts)}
    </section>
  `;
}

function renderCommunityPanel() {
  const root = document.getElementById('community-root');
  if (!root || !communityCtx.data) return;

  const tabs = [
    { id: 'all', label: '전체' },
    { id: 'notices', label: '공지' },
    { id: 'schedules', label: '일정' },
    { id: 'polls', label: '투표' },
    { id: 'posts', label: '게시판' },
    { id: 'mine', label: '내 활동' }
  ];

  root.innerHTML = `
    <nav class="community-subnav" role="tablist">
      ${tabs
        .map(
          (t) =>
            `<button type="button" class="community-subnav-btn ${communityCtx.activeTab === t.id ? 'active' : ''}" data-subtab="${t.id}">${t.label}</button>`
        )
        .join('')}
    </nav>
    <div class="community-content">${renderCommunityContent()}</div>
  `;

  bindCommunityEvents();
}

function bindCommunityEvents() {
  document.querySelectorAll('.community-subnav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      communityCtx.activeTab = btn.dataset.subtab;
      if (btn.dataset.subtab !== 'posts' && btn.dataset.subtab !== 'all' && btn.dataset.subtab !== 'mine') {
        communityCtx.selectedPostId = null;
        syncCommunityPostUrl(null);
      }
      renderCommunityPanel();
    });
  });

  document.getElementById('post-detail-back')?.addEventListener('click', closePostDetail);

  document.querySelectorAll('.post-preview-link').forEach((btn) => {
    btn.addEventListener('click', () => openPostDetail(btn.dataset.postId));
  });

  document.querySelectorAll('.activity-link[data-post-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      communityCtx.activeTab = 'posts';
      openPostDetail(btn.dataset.postId);
    });
  });

  const loginBtn = document.getElementById('community-login-btn');
  if (loginBtn && typeof showLoginModal === 'function') {
    loginBtn.addEventListener('click', () => showLoginModal());
  }

  document.getElementById('form-notice')?.addEventListener('submit', onSubmitNotice);
  document.getElementById('form-schedule')?.addEventListener('submit', onSubmitSchedule);
  document.getElementById('form-poll')?.addEventListener('submit', onSubmitPoll);
  document.getElementById('form-post')?.addEventListener('submit', onSubmitPost);

  document.querySelectorAll('.poll-vote-form').forEach((form) => {
    form.addEventListener('submit', onSubmitVote);
  });

  document.querySelectorAll('.comment-form').forEach((form) => {
    form.addEventListener('submit', onSubmitComment);
  });

  document.querySelectorAll('.btn-like').forEach((btn) => {
    btn.addEventListener('click', onToggleLike);
  });

  document.querySelectorAll('.btn-del').forEach((btn) => {
    btn.addEventListener('click', onDeleteItem);
  });

  document.querySelectorAll('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', onStartEdit);
  });

  document.querySelectorAll('.btn-cancel-edit').forEach((btn) => {
    btn.addEventListener('click', onCancelEdit);
  });

  document.querySelectorAll('.post-edit-form').forEach((form) => {
    form.addEventListener('submit', onSubmitPostEdit);
  });

  document.querySelectorAll('.comment-edit-form').forEach((form) => {
    form.addEventListener('submit', onSubmitCommentEdit);
  });

  if (typeof window.initKakaoScheduleMaps === 'function') {
    window.initKakaoScheduleMaps();
  }
}

function onStartEdit(e) {
  const { type, id } = e.currentTarget.dataset;
  if (type === 'post') {
    communityCtx.editingPostId = id;
    communityCtx.editingCommentId = null;
  } else if (type === 'comment') {
    communityCtx.editingCommentId = id;
  }
  renderCommunityPanel();
}

function onCancelEdit() {
  communityCtx.editingPostId = null;
  communityCtx.editingCommentId = null;
  renderCommunityPanel();
}

async function onSubmitPostEdit(e) {
  e.preventDefault();
  const postId = e.target.dataset.postId;
  const fd = new FormData(e.target);
  const result = await communityFetch(`/community/posts/${postId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: fd.get('title'), body: fd.get('body') })
  });
  if (!result.ok) return;
  communityCtx.editingPostId = null;
  showToast('게시글이 수정되었습니다.', 'success');
  await loadCommunityData();
}

async function onSubmitCommentEdit(e) {
  e.preventDefault();
  const commentId = e.target.dataset.commentId;
  const fd = new FormData(e.target);
  const result = await communityFetch(`/community/comments/${commentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: fd.get('body') })
  });
  if (!result.ok) return;
  communityCtx.editingCommentId = null;
  showToast('댓글이 수정되었습니다.', 'success');
  await loadCommunityData();
}

async function onSubmitNotice(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const result = await communityFetch('/community/notices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: fd.get('title'),
      body: fd.get('body'),
      pinned: fd.get('pinned') === 'on'
    })
  });
  if (!result.ok) return;
  showToast('공지가 등록되었습니다.', 'success');
  e.target.reset();
  await loadCommunityData();
}

async function onSubmitSchedule(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const result = await communityFetch('/community/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: fd.get('title'),
      eventDate: fd.get('eventDate'),
      eventTime: fd.get('eventTime'),
      location: fd.get('location'),
      description: fd.get('description')
    })
  });
  if (!result.ok) return;
  showToast('일정이 등록되었습니다.', 'success');
  e.target.reset();
  await loadCommunityData();
}

async function onSubmitPoll(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const options = [fd.get('opt1'), fd.get('opt2'), fd.get('opt3')].filter(Boolean);
  const result = await communityFetch('/community/polls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: fd.get('question'), options })
  });
  if (!result.ok) return;
  showToast('투표가 개설되었습니다.', 'success');
  e.target.reset();
  await loadCommunityData();
}

async function onSubmitPost(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const result = await communityFetch('/community/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: fd.get('title'), body: fd.get('body') })
  });
  if (!result.ok) return;
  showToast('게시글이 등록되었습니다.', 'success');
  e.target.reset();
  await loadCommunityData();
}

async function onSubmitVote(e) {
  e.preventDefault();
  const pollId = e.target.dataset.pollId;
  const selected = e.target.querySelector('input[type="radio"]:checked');
  if (!selected) {
    showToast('항목을 선택해주세요.', 'warning');
    return;
  }
  const result = await communityFetch(`/community/polls/${pollId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionIndex: parseInt(selected.value, 10) })
  });
  if (!result.ok) return;
  showToast('투표가 반영되었습니다.', 'success');
  await loadCommunityData();
}

async function onSubmitComment(e) {
  e.preventDefault();
  const postId = e.target.dataset.postId;
  const fd = new FormData(e.target);
  const result = await communityFetch(`/community/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: fd.get('body') })
  });
  if (!result.ok) return;
  e.target.reset();
  await loadCommunityData();
}

async function onToggleLike(e) {
  if (!communityCtx.loggedIn) {
    showToast('로그인이 필요합니다.', 'warning');
    if (typeof showLoginModal === 'function') showLoginModal();
    return;
  }
  const { type, id } = e.currentTarget.dataset;
  const path =
    type === 'post'
      ? `/community/posts/${id}/like`
      : `/community/comments/${id}/like`;
  const result = await communityFetch(path, { method: 'POST' });
  if (!result.ok) return;
  await loadCommunityData();
}

async function onDeleteItem(e) {
  const { type, id } = e.currentTarget.dataset;
  if (!confirm('정말 삭제하시겠습니까?')) return;

  const paths = {
    notice: `/community/notices/${id}`,
    schedule: `/community/schedules/${id}`,
    poll: `/community/polls/${id}`,
    post: `/community/posts/${id}`,
    comment: `/community/comments/${id}`
  };
  const result = await communityFetch(paths[type], { method: 'DELETE' });
  if (!result.ok) return;
  if (type === 'post' && communityCtx.selectedPostId === id) {
    communityCtx.selectedPostId = null;
    syncCommunityPostUrl(null);
  }
  showToast('삭제되었습니다.', 'success');
  await loadCommunityData();
}

async function initCommunityPanel(projectId, options = {}) {
  communityCtx.projectId = projectId;
  communityCtx.loggedIn = options.loggedIn || false;
  communityCtx.user = options.user || null;
  communityCtx.activeTab = options.activeTab || 'all';
  communityCtx.selectedPostId = options.postId || null;

  const root = document.getElementById('community-root');
  if (!root) return;
  root.innerHTML = '<p class="community-loading">커뮤니티를 불러오는 중...</p>';
  await loadCommunityData();
}

window.initCommunityPanel = initCommunityPanel;
window.refreshCommunityPanel = loadCommunityData;
window.openCommunityPost = openPostDetail;
