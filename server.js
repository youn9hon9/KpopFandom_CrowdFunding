require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const oauth = require('./lib/oauth');
const roles = require('./lib/roles');
const db = require('./lib/database');
const community = require('./lib/community');
const { registerCommunityRoutes } = require('./lib/communityRoutes');
const { registerAdminRoutes } = require('./lib/adminRoutes');
const adminLib = require('./lib/admin');
const projectList = require('./lib/projectList');
const validate = require('./lib/validate');
const kakaoMap = require('./lib/kakaoMap');
const { projectCoverUpload } = require('./lib/upload');
const csvExport = require('./lib/csvExport');
const activity = require('./lib/activity');
const { registerActivityRoutes } = require('./lib/activityRoutes');
const { registerFavoritesRoutes } = require('./lib/favoritesRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

db.initDatabase();
db.scheduleCommunityBackfill(db);

const heroSlides = [
  {
    title: '내 최애의 생일, 안전하고 투명하게 축하해요',
    subtitle: '덕라우드와 함께하는 K-POP 팬 주최 이벤트 펀딩',
    gradient: 'linear-gradient(135deg, #00C471 0%, #00a85e 50%, #667eea 100%)',
    emoji: '💚'
  },
  {
    title: '총대의 덕질 온도로 신뢰를 확인하세요',
    subtitle: '성공 이력 기반 매너온도 · 안전 결제',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    emoji: '🌡️'
  },
  {
    title: '생일카페부터 지하철 광고까지',
    subtitle: '팬덤이 만드는 모든 축하 프로젝트',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    emoji: '🎉'
  }
];

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  const sessionId = req.cookies.session_id;
  const stored = db.sessionStore.get(sessionId);
  if (stored) {
    const prevAdminMode = stored.adminMode;
    req.user = roles.assignRole(stored);
    if (req.user.role === 'admin' && prevAdminMode === false) {
      req.user.adminMode = false;
    }
  } else {
    req.user = null;
  }
  next();
});

app.get('/auth/google', async (req, res) => {
  if (!oauth.isGoogleConfigured()) {
    return res.redirect('/oauth-setup.html?provider=google');
  }

  try {
    const authUrl = await oauth.buildGoogleAuthRedirect();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Google OAuth Start Error:', error);
    res.redirect('/?error=google_auth_start_failed');
  }
});

app.get('/auth/google/callback', async (req, res) => {
  if (!oauth.isGoogleConfigured()) {
    return res.redirect('/oauth-setup.html?provider=google');
  }

  try {
    const userProfile = await oauth.handleGoogleCallback(req);
    oauth.createSession(res, db.sessionStore, roles.assignRole(userProfile));
    res.redirect('/');
  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    res.redirect(`/?error=google_auth_failed&msg=${encodeURIComponent(error.message)}`);
  }
});

app.get('/auth/kakao', (req, res) => {
  if (!oauth.isKakaoConfigured()) {
    return res.redirect('/oauth-setup.html?provider=kakao');
  }

  try {
    const authUrl = oauth.buildKakaoAuthRedirect();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Kakao OAuth Start Error:', error);
    res.redirect('/?error=kakao_auth_start_failed');
  }
});

app.get('/auth/kakao/callback', async (req, res) => {
  if (!oauth.isKakaoConfigured()) {
    return res.redirect('/oauth-setup.html?provider=kakao');
  }

  try {
    const userProfile = await oauth.handleKakaoCallback(req);
    oauth.createSession(res, db.sessionStore, roles.assignRole(userProfile));
    res.redirect('/');
  } catch (error) {
    console.error('Kakao OAuth Callback Error:', error);
    res.redirect(`/?error=kakao_auth_failed&msg=${encodeURIComponent(error.message)}`);
  }
});

app.get('/api/auth/me', (req, res) => {
  if (req.user) {
    res.json({ loggedIn: true, user: roles.toAuthUser(req.user) });
  } else {
    res.json({ loggedIn: false });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.cookies.session_id;
  if (sessionId) {
    db.sessionStore.delete(sessionId);
  }
  res.setHeader('Set-Cookie', 'session_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.json({ success: true });
});

app.post('/api/projects/:id/sponsor', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
  }

  const projectId = parseInt(req.params.id, 10);
  const project = db.getProjectById(projectId);
  if (!project) {
    return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.', code: 'PROJECT_NOT_FOUND' });
  }

  if (project.status === '심사 중' || project.status === '심사 거절') {
    return res.status(400).json({
      error: '심사 중이거나 거절된 프로젝트는 후원할 수 없습니다.',
      code: 'SPONSOR_NOT_ALLOWED'
    });
  }

  if (roles.isProjectHost(req.user, project)) {
    return res.status(403).json({
      error: '본인이 개설한 프로젝트는 후원할 수 없습니다.',
      code: 'FORBIDDEN'
    });
  }

  const { amount, paymentMethod } = req.body;
  const amountValidation = validate.validateSponsorAmount(amount);
  if (!amountValidation.ok) {
    return res.status(400).json({ error: amountValidation.error, code: amountValidation.code });
  }
  const parsedAmount = amountValidation.value;

  const donation = {
    id: 'donation-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    userId: req.user.id,
    projectId: projectId,
    amount: parsedAmount,
    paymentMethod: paymentMethod || '신용카드',
    status: 'holding',
    createdAt: new Date().toISOString()
  };
  db.createDonation(donation);

  project.currentAmount = (project.currentAmount || 0) + parsedAmount;
  project.percentFunded = Math.round((project.currentAmount / project.goalAmount) * 100);
  db.saveProject(project);

  res.json({ success: true, donation, project });
});

app.post('/api/projects', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
  }

  const { title, category, goalAmount, story, emoji, gradient, daysLeft, escrowPlan, coverImage } = req.body;
  const projectValidation = validate.validateProjectCreate({ title, category, goalAmount, story, daysLeft });
  if (!projectValidation.ok) {
    return res.status(400).json({ error: projectValidation.error, code: projectValidation.code });
  }

  const newProject = db.createProject({
    title: projectValidation.title,
    category: projectValidation.category,
    hostName: req.user.name,
    hostUserId: req.user.id,
    trustTemperature: 36.5,
    successCount: 0,
    status: '심사 중',
    goalAmount: projectValidation.goalAmount,
    currentAmount: 0,
    percentFunded: 0,
    daysLeft: projectValidation.daysLeft,
    gradient: gradient || 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    emoji: emoji || '🎂',
    coverImage: coverImage && String(coverImage).startsWith('/uploads/') ? coverImage : null,
    story: projectValidation.story,
    escrowPlan: String(escrowPlan || '').trim().slice(0, validate.LIMITS.escrowPlan),
    submittedAt: new Date().toISOString(),
    reviewNotes: [],
    rejectedReason: '',
    community: { notices: [], schedules: [], polls: [], posts: [] },
    refundPolicy: '목표 금액 미달성 시 전액 자동 환불됩니다. 펀딩 종료 후 7영업일 이내 결제 수단으로 환불 처리됩니다.'
  });

  res.json({ success: true, project: newProject });
});

app.get('/api/users/me/escrow', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
  }

  const donations = db.getAllDonations();
  const userDonations = donations
    .filter((d) => d.userId === req.user.id)
    .map((d) => {
      const p = db.getProjectById(d.projectId);
      return {
        ...d,
        projectTitle: p ? p.title : '알 수 없는 프로젝트',
        projectStatus: p ? p.status : '알 수 없음',
        projectGradient: p ? p.gradient : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        projectEmoji: p ? p.emoji : '❓'
      };
    });

  const userProjects = db.getProjectsByHostUserId(req.user.id);

  res.json({
    success: true,
    donations: userDonations,
    createdProjects: userProjects
  });
});

app.post('/api/donations/:id/refund', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
  }

  const donationId = req.params.id;
  const donation = db.getDonationById(donationId);
  if (!donation || donation.userId !== req.user.id) {
    return res.status(404).json({ error: '후원 내역을 찾을 수 없습니다.', code: 'DONATION_NOT_FOUND' });
  }

  if (donation.status !== 'holding') {
    return res.status(400).json({ error: '이미 환불되거나 정산 완료된 내역은 환불할 수 없습니다.', code: 'REFUND_NOT_ALLOWED' });
  }

  const project = db.getProjectById(donation.projectId);
  if (!project) {
    return res.status(404).json({ error: '연관된 프로젝트를 찾을 수 없습니다.', code: 'PROJECT_NOT_FOUND' });
  }

  if (project.status !== '펀딩 진행 중' && project.status !== '심사 중') {
    return res.status(400).json({ error: '펀딩 진행 중인 프로젝트만 취소/환불할 수 있습니다.', code: 'REFUND_NOT_ALLOWED' });
  }

  donation.status = 'refunded';
  db.updateDonation(donation);

  project.currentAmount = Math.max(0, (project.currentAmount || 0) - donation.amount);
  project.percentFunded = Math.round((project.currentAmount / project.goalAmount) * 100);
  db.saveProject(project);

  res.json({ success: true, donation, project });
});

registerCommunityRoutes(app, db);
registerAdminRoutes(app, db);
registerActivityRoutes(app, db);
registerFavoritesRoutes(app, db);

app.get('/api/config/public', (req, res) => {
  res.json({
    success: true,
    kakaoMapKey: kakaoMap.getJavascriptKey() || null,
    kakaoGeocodeEnabled: kakaoMap.isGeocodeConfigured()
  });
});

app.get('/api/maps/geocode', async (req, res) => {
  const query = String(req.query.query || req.query.q || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'query가 필요합니다.', code: 'VALIDATION_ERROR' });
  }
  if (!kakaoMap.isGeocodeConfigured()) {
    return res.status(503).json({
      error: '카카오 REST API 키가 설정되지 않았습니다.',
      code: 'MAP_NOT_CONFIGURED',
      mapUrl: kakaoMap.buildMapSearchUrl(query)
    });
  }
  try {
    const result = await kakaoMap.geocodeAddress(query);
    if (!result) {
      return res.status(404).json({
        error: '장소를 찾을 수 없습니다.',
        code: 'PLACE_NOT_FOUND',
        mapUrl: kakaoMap.buildMapSearchUrl(query)
      });
    }
    res.json({
      success: true,
      ...result,
      mapUrl: kakaoMap.buildMapLinkUrl(result.lat, result.lng, result.placeName)
    });
  } catch (err) {
    console.error('[Geocode]', err);
    res.status(500).json({ error: '지도 검색에 실패했습니다.', code: 'GEOCODE_FAILED' });
  }
});

app.post('/api/upload/project-cover', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
  }
  projectCoverUpload.single('cover')(req, res, (err) => {
    if (err) {
      const message = err.message || '이미지 업로드에 실패했습니다.';
      return res.status(400).json({ error: message, code: 'UPLOAD_ERROR' });
    }
    if (!req.file) {
      return res.status(400).json({ error: '이미지 파일을 선택해 주세요.', code: 'VALIDATION_ERROR' });
    }
    res.json({ success: true, url: `/uploads/covers/${req.file.filename}` });
  });
});

app.get('/api/users/me/escrow/export.csv', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
  }

  const donations = db.getAllDonations().filter((d) => d.userId === req.user.id);
  const rows = donations.map((d) => {
    const p = db.getProjectById(d.projectId);
    return {
      projectTitle: p ? p.title : '알 수 없음',
      amount: d.amount,
      status: d.status,
      paymentMethod: d.paymentMethod,
      createdAt: d.createdAt
    };
  });

  csvExport.sendCsv(res, 'my-donations.csv', rows, [
    { key: 'projectTitle', label: '프로젝트' },
    { key: 'amount', label: '금액' },
    { key: 'status', label: '상태' },
    { key: 'paymentMethod', label: '결제수단' },
    { key: 'createdAt', label: '일시' }
  ]);
});

app.get('/api/admin/projects/pending', roles.requireAdmin, (req, res) => {
  const pending = db
    .getPendingProjects()
    .map((p) => roles.toPublicProject(p, { includeAdminFields: true }));
  res.json({ success: true, projects: pending });
});

app.get('/api/admin/projects/:id', roles.requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const project = db.getProjectById(id);
  if (!project) {
    return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.', code: 'PROJECT_NOT_FOUND' });
  }
  const stats = roles.getProjectStats(id, db.getAllDonations());
  res.json({
    success: true,
    project: roles.toPublicProject(project, { includeAdminFields: true, ...stats })
  });
});

app.post('/api/admin/projects/:id/review', roles.requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const project = db.getProjectById(id);
  if (!project) {
    return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.', code: 'PROJECT_NOT_FOUND' });
  }
  if (project.status !== '심사 중') {
    return res.status(400).json({ error: '심사 중인 프로젝트만 처리할 수 있습니다.', code: 'REVIEW_NOT_ALLOWED' });
  }

  const { action, reason } = req.body;
  if (action === 'approve') {
    project.status = '펀딩 진행 중';
    project.featured = true;
    project.rejectedReason = '';
    project.reviewNotes.push({
      date: new Date().toISOString().slice(0, 10),
      action: 'approve',
      by: req.user.email,
      note: '심사 승인 — 펀딩 오픈'
    });
    adminLib.sendHostDm(
      project,
      req.user,
      '축하합니다! 프로젝트 심사가 승인되었습니다. 펀딩이 시작되었으며 메인 추천 목록에 노출됩니다.',
      { type: 'approve' }
    );
  } else if (action === 'reject') {
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: '거절 사유를 입력해 주세요.', code: 'VALIDATION_ERROR' });
    }
    project.status = '심사 거절';
    project.rejectedReason = reason.trim();
    project.reviewNotes.push({
      date: new Date().toISOString().slice(0, 10),
      action: 'reject',
      by: req.user.email,
      note: reason.trim()
    });
    adminLib.sendHostDm(
      project,
      req.user,
      `심사 결과 안내: 프로젝트가 거절되었습니다.\n\n거절 사유:\n${reason.trim()}\n\n내용을 보완한 뒤 다시 신청해 주세요.`,
      { type: 'reject' }
    );
  } else {
    return res.status(400).json({ error: 'action은 approve 또는 reject여야 합니다.', code: 'VALIDATION_ERROR' });
  }

  db.saveProject(project);
  res.json({ success: true, project });
});

const publicDir = path.join(__dirname, 'public');

app.get('/detail.html', (req, res) => {
  const id = req.query.id;
  if (!id) {
    return res.redirect('/error.html?code=404');
  }
  const params = new URLSearchParams();
  if (req.query.tab) params.set('tab', req.query.tab);
  if (req.query.post) params.set('post', req.query.post);
  const qs = params.toString();
  res.redirect(301, qs ? `/projects/${id}?${qs}` : `/projects/${id}`);
});

app.get('/admin.html', (req, res) => {
  const id = req.query.id;
  if (id) {
    return res.redirect(301, `/admin/projects/${id}`);
  }
  const view = req.query.view;
  res.redirect(301, view ? `/admin?view=${encodeURIComponent(view)}` : '/admin');
});

app.get('/projects/:id/posts/:postId', (req, res) => {
  res.sendFile(path.join(publicDir, 'detail.html'));
});

app.get('/projects/:id', (req, res) => {
  res.sendFile(path.join(publicDir, 'detail.html'));
});

app.get('/admin/projects/:id', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

app.get('/mypage', (req, res) => {
  res.sendFile(path.join(publicDir, 'mypage.html'));
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(publicDir));

app.get('/api/hero-slides', (req, res) => {
  res.json(heroSlides);
});

app.get('/api/projects', (req, res) => {
  const { q = '', category = '', artist = '', filter = 'featured', sort = '' } = req.query;
  const { limit, offset } = validate.parsePagination(req.query);
  const normalizedSort = validate.normalizeSort(sort);
  const all = projectList.listProjects(db.getAllProjects(), {
    q,
    category,
    artist,
    filter,
    sort: normalizedSort
  });
  const page = projectList.paginate(all, limit, offset);
  res.json({
    success: true,
    filter,
    category: category || null,
    artist: artist || null,
    q: q || null,
    sort: normalizedSort || null,
    label: projectList.FILTER_LABELS[filter] || '프로젝트 목록',
    count: page.total,
    limit: page.limit,
    offset: page.offset,
    hasMore: page.hasMore,
    projects: page.items.map(projectList.toListCard)
  });
});

app.get('/api/projects/featured', (req, res) => {
  res.json(db.getFeaturedProjects());
});

app.get('/api/projects/popular', (req, res) => {
  res.json(db.getPopularProjects());
});

app.get('/api/projects/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const project = db.getProjectById(id);
  if (!project) {
    return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.', code: 'PROJECT_NOT_FOUND' });
  }

  const communityBefore = JSON.stringify(project.community || {});
  community.ensureCommunity(project);
  if (JSON.stringify(project.community) !== communityBefore) {
    db.saveProject(project);
  }

  const donations = db.getAllDonations();
  const viewerRole = roles.getViewerRole(req.user, project);
  const stats = roles.getProjectStats(id, donations);

  let myDonation = null;
  if (req.user) {
    const donation = donations.find(
      (d) => d.userId === req.user.id && d.projectId === id && d.status === 'holding'
    );
    if (donation) {
      myDonation = {
        id: donation.id,
        amount: donation.amount,
        status: donation.status,
        paymentMethod: donation.paymentMethod,
        createdAt: donation.createdAt
      };
    }
  }

  const includeHost = viewerRole === 'host' || viewerRole === 'admin';
  const includeAdmin = viewerRole === 'admin';

  if (req.user) {
    activity.recordActivity(db, req.user.id, 'view', {
      projectId: id,
      title: project.title
    });
  }

  res.json({
    viewerRole,
    project: roles.toPublicProject(project, {
      includeHostFields: includeHost,
      includeAdminFields: includeAdmin,
      ...stats
    }),
    myDonation,
    hostStats: includeHost
      ? {
          sponsorCount: stats.sponsorCount,
          escrowHolding: stats.escrowHolding,
          totalDonations: stats.totalDonations
        }
      : null
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({
    error: '요청한 API를 찾을 수 없습니다.',
    code: 'API_NOT_FOUND'
  });
});

app.use((req, res) => {
  const from = encodeURIComponent(req.originalUrl);
  res.redirect(`/error.html?code=404&from=${from}`);
});

app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err);

  if (req.path.startsWith('/api/') || req.originalUrl.startsWith('/api/')) {
    return res.status(500).json({
      error: '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }

  const message = encodeURIComponent(err.message || '');
  res.redirect(`/error.html?code=500&message=${message}`);
});

async function startServer() {
  try {
    await oauth.initGoogleOAuth();
  } catch (error) {
    console.error('Google OAuth discovery failed:', error.message);
  }

  const authStatus = oauth.getAuthStatus();
  app.listen(PORT, () => {
    console.log(`Duckrowd demo server running at http://localhost:${PORT}`);
    console.log(`Redirect base: ${authStatus.redirectBase}`);
    console.log(`Google OAuth: ${authStatus.google ? 'enabled' : 'NOT configured — set .env'}`);
    console.log(`Kakao OAuth:  ${authStatus.kakao ? 'enabled' : 'NOT configured — set .env'}`);
    console.log(`Kakao Map JS: ${kakaoMap.getJavascriptKey() ? 'enabled' : 'NOT configured — set KAKAO_MAP_JAVASCRIPT_KEY'}`);
    console.log(`Kakao Geocode: ${kakaoMap.isGeocodeConfigured() ? 'enabled (REST key)' : 'NOT configured'}`);
  });
}

startServer();
