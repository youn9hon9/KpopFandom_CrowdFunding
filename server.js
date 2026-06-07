require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const projects = [
  {
    id: 1,
    title: '서울 강남역 2호선 생일 카페 — 하루 종일 팬 이벤트',
    category: '생일카페',
    hostName: '별빛총대',
    trustTemperature: 91,
    successCount: 12,
    status: '펀딩 진행 중',
    goalAmount: 8000000,
    currentAmount: 6240000,
    percentFunded: 78,
    daysLeft: 9,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    emoji: '🎂',
    featured: true,
    popularRank: 1,
    story: `<p>최애의 생일을 맞아 강남역 인근 카페 전층을 팬 이벤트 공간으로 꾸밉니다.</p>
<p>포토존, 포토카드 교환 데스크, 생일 케이크 커팅 타임까지 준비했습니다. 모든 정산은 덕라우드 에스크로를 통해 투명하게 진행됩니다.</p>
<p>목표 달성 시 추가 굿즈(컵홀더 세트)가 후원자 전원에게 제공됩니다.</p>`,
    community: {
      notices: [
        { date: '2026-05-20', title: '카페 예약 확정 안내', body: '5/28~5/30 3일간 예약이 완료되었습니다.' },
        { date: '2026-05-15', title: '굿즈 시안 공개', body: '컵홀더 디자인 투표 결과를 반영했습니다.' }
      ],
      polls: [
        {
          id: 'poll-1',
          question: '생일 케이크 디자인은 어떤 스타일이 좋을까요?',
          options: [
            { label: '클래식 화이트', votes: 142 },
            { label: '포인트 컬러 그라데이션', votes: 218 },
            { label: '미니 캐릭터 피규어', votes: 95 }
          ]
        }
      ]
    },
    refundPolicy: '목표 금액 미달성 시 전액 자동 환불됩니다. 펀딩 종료 후 7영업일 이내 결제 수단으로 환불 처리됩니다. 무산 확정 시에도 동일 정책이 적용됩니다.'
  },
  {
    id: 2,
    title: '홍대입구역 커피차 — 500잔 응원 이벤트',
    category: '커피차',
    hostName: '달빛응원단',
    trustTemperature: 88,
    successCount: 8,
    status: '펀딩 진행 중',
    goalAmount: 5500000,
    currentAmount: 4950000,
    percentFunded: 90,
    daysLeft: 4,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    emoji: '☕',
    featured: true,
    popularRank: 2,
    story: `<p>컴백 주간 홍대입구역 앞에서 아티스트와 스태프를 위한 커피차를 운영합니다.</p>
<p>음료 500잔 + 간식 세트, 스태프용 에너지 드링크를 포함한 패키지입니다.</p>`,
    community: {
      notices: [
        { date: '2026-05-22', title: '커피차 업체 계약 완료', body: '메뉴 구성은 투표 결과를 반영합니다.' }
      ],
      polls: [
        {
          id: 'poll-1',
          question: '대표 음료 메뉴를 골라주세요',
          options: [
            { label: '아메리카노', votes: 89 },
            { label: '라떼', votes: 201 },
            { label: '에이드', votes: 156 }
          ]
        }
      ]
    },
    refundPolicy: '이벤트 취소 시 전액 환불. 부분 진행 불가 시 남은 금액 비례 환불 후 안내드립니다.'
  },
  {
    id: 3,
    title: '신사역 7호선 지하철 스크린도어 광고',
    category: '지하철광고',
    hostName: '역사팬클럽',
    trustTemperature: 85,
    successCount: 5,
    status: '펀딩 진행 중',
    goalAmount: 12000000,
    currentAmount: 7200000,
    percentFunded: 60,
    daysLeft: 18,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    emoji: '🚇',
    featured: true,
    popularRank: 3,
    story: `<p>생일 주간 신사역 스크린도어에 축하 영상·이미지를 2주간 게재합니다.</p>
<p>디자인 시안은 커뮤니티 투표로 확정됩니다.</p>`,
    community: {
      notices: [
        { date: '2026-05-10', title: '광고 심의 서류 제출', body: '심의 통과 후 일정이 확정됩니다.' }
      ],
      polls: []
    },
    refundPolicy: '광고 심의 불통과 시 전액 환불. 통과 후 일정 변경은 호스트 공지 후 협의합니다.'
  },
  {
    id: 4,
    title: '앨범 공동구매 + 응원 포스터 세트',
    category: '앨범공구',
    hostName: '앨범마스터',
    trustTemperature: 79,
    successCount: 15,
    status: '펀딩 진행 중',
    goalAmount: 3200000,
    currentAmount: 2560000,
    percentFunded: 80,
    daysLeft: 12,
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    emoji: '💿',
    featured: true,
    popularRank: 4,
    story: `<p>신규 미니앨범 공구 및 응원 포스터 번들 패키지입니다.</p>`,
    community: {
      notices: [{ date: '2026-05-18', title: '발주 수량 집계 중', body: '마감 D-12 기준 80% 달성' }],
      polls: []
    },
    refundPolicy: '발주 전 취소 시 전액 환불. 발주 후에는 제작 특성상 환불이 제한될 수 있습니다.'
  },
  {
    id: 5,
    title: '전국 카페 컵홀더 콜라보 — 50개 매장',
    category: '컵홀더',
    hostName: '컵홀더연합',
    trustTemperature: 82,
    successCount: 6,
    status: '펀딩 진행 중',
    goalAmount: 4500000,
    currentAmount: 3150000,
    percentFunded: 70,
    daysLeft: 15,
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    emoji: '🥤',
    featured: true,
    popularRank: 5,
    story: `<p>전국 50개 제휴 카페에서 한정 컵홀더를 배포합니다.</p>`,
    community: { notices: [], polls: [] },
    refundPolicy: '목표 미달성 시 전액 자동 환불.'
  },
  {
    id: 6,
    title: '올림픽공원 응원봉 커스텀 컬러 펀딩',
    category: '응원봉',
    hostName: '빛나는총대',
    trustTemperature: 76,
    successCount: 4,
    status: '심사 중',
    goalAmount: 6000000,
    currentAmount: 0,
    percentFunded: 0,
    daysLeft: 30,
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    emoji: '✨',
    featured: true,
    popularRank: null,
    story: `<p>공식 응원봉 커스텀 컬러 제작 건입니다. 현재 플랫폼 심사 중이며 승인 후 펀딩이 시작됩니다.</p>`,
    community: {
      notices: [{ date: '2026-05-25', title: '심사 진행 안내', body: '예상 3~5일 소요' }],
      polls: []
    },
    refundPolicy: '심사 단계에서는 결제가 진행되지 않습니다. 펀딩 시작 후 미달성 시 전액 환불.'
  },
  {
    id: 7,
    title: '성수동 팝업 전시회 — 팬아트 & 굿즈',
    category: '전시회',
    hostName: '아트덕후',
    trustTemperature: 73,
    successCount: 3,
    status: '펀딩 진행 중',
    goalAmount: 7000000,
    currentAmount: 4550000,
    percentFunded: 65,
    daysLeft: 21,
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    emoji: '🖼️',
    featured: true,
    popularRank: null,
    story: `<p>팬아트 전시 및 한정 굿즈 판매 공간을 2주간 운영합니다.</p>`,
    community: { notices: [], polls: [] },
    refundPolicy: '전시 취소 시 전액 환불.'
  },
  {
    id: 8,
    title: '부산 서면 생일 광고 빌보드',
    category: '지하철광고',
    hostName: '부산팬연합',
    trustTemperature: 68,
    successCount: 2,
    status: '펀딩 진행 중',
    goalAmount: 9000000,
    currentAmount: 2700000,
    percentFunded: 30,
    daysLeft: 25,
    gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    emoji: '📢',
    featured: true,
    popularRank: null,
    story: `<p>서면 역 일대 옥외 빌보드 생일 축하 광고입니다.</p>`,
    community: { notices: [], polls: [] },
    refundPolicy: '목표 미달성 시 전액 환불.'
  },
  {
    id: 9,
    title: '대구 동성로 커피차 — 야간 응원',
    category: '커피차',
    hostName: '대구덕친구',
    trustTemperature: 58,
    successCount: 1,
    status: '무산/자동 환불 예정',
    goalAmount: 4000000,
    currentAmount: 1200000,
    percentFunded: 30,
    daysLeft: 2,
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
    emoji: '🌙',
    featured: true,
    popularRank: null,
    story: `<p>목표 달성이 어려워 무산 처리 예정입니다. 결제하신 분들께는 자동 환불이 진행됩니다.</p>`,
    community: {
      notices: [{ date: '2026-05-26', title: '무산 안내', body: 'D-2 기준 30% 달성으로 무산 절차가 시작됩니다.' }],
      polls: []
    },
    refundPolicy: '무산 확정 시 100% 자동 환불. 환불은 3~5영업일 내 완료됩니다. 별도 신청 없이 처리됩니다.'
  },
  {
    id: 10,
    title: '기타 — 팬미팅 환영 플래카드 100장 제작',
    category: '기타',
    hostName: '신입총대',
    trustTemperature: 42,
    successCount: 0,
    status: '심사 중',
    goalAmount: 1500000,
    currentAmount: 0,
    percentFunded: 0,
    daysLeft: 45,
    gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    emoji: '🏳️',
    featured: false,
    popularRank: null,
    story: `<p>첫 프로젝트로 플래카드 제작 펀딩을 준비 중입니다.</p>`,
    community: { notices: [], polls: [] },
    refundPolicy: '심사 통과 후 펀딩 오픈. 미달성 시 전액 환불.'
  }
];

const heroSlides = [
  {
    title: '내 최애의 생일, 안전하고 투명하게 축하해요',
    subtitle: '덕라우드와 함께하는 K-POP 팬 주최 이벤트 펀딩',
    gradient: 'linear-gradient(135deg, #00C471 0%, #00a85e 50%, #667eea 100%)',
    emoji: '💚'
  },
  {
    title: '총대의 덕질 온도로 신뢰를 확인하세요',
    subtitle: '성공 이력 기반 매너온도 · 안전 에스크로 결제',
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

// Simple Cookie Parser Middleware
app.use((req, res, next) => {
  const cookies = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
    });
  }
  req.cookies = cookies;
  next();
});

// Session store (in-memory)
const sessions = {}; // sessionId -> user profile

// Session check middleware
app.use((req, res, next) => {
  const sessionId = req.cookies.session_id;
  if (sessionId && sessions[sessionId]) {
    req.user = sessions[sessionId];
  } else {
    req.user = null;
  }
  next();
});

// Helper to determine if a provider is configured with real credentials
function isConfigured(provider) {
  const baseUri = process.env.REDIRECT_URI_BASE;
  if (!baseUri || baseUri.includes('your_')) return false;

  if (provider === 'google') {
    const cid = process.env.GOOGLE_CLIENT_ID;
    const csec = process.env.GOOGLE_CLIENT_SECRET;
    return cid && csec && !cid.startsWith('your_') && !csec.startsWith('your_');
  }
  if (provider === 'kakao') {
    const cid = process.env.KAKAO_CLIENT_ID;
    return cid && !cid.startsWith('your_');
  }
  return false;
}

// Google OAuth Authorization
app.get('/auth/google', (req, res) => {
  const redirectBase = process.env.REDIRECT_URI_BASE || `http://localhost:${PORT}`;
  const redirectUri = `${redirectBase}/auth/google/callback`;

  if (isConfigured('google')) {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(process.env.GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=openid%20profile%20email`;
    res.redirect(googleAuthUrl);
  } else {
    res.redirect(`/mock-login.html?provider=google&redirect_uri=${encodeURIComponent(redirectUri)}`);
  }
});

// Google OAuth Callback
app.get('/auth/google/callback', async (req, res) => {
  const { code, mock, name, email, avatar } = req.query;
  const redirectBase = process.env.REDIRECT_URI_BASE || `http://localhost:${PORT}`;
  const redirectUri = `${redirectBase}/auth/google/callback`;

  let userProfile = null;

  if (mock === 'true' || !isConfigured('google')) {
    userProfile = {
      id: 'mock-google-' + Date.now(),
      name: name || '홍길동 (Google Mock)',
      email: email || 'mock-google@example.com',
      avatar: avatar || '',
      provider: 'google'
    };
  } else if (code) {
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange Google OAuth code');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch Google user profile');
      }

      const userData = await userResponse.json();
      userProfile = {
        id: userData.sub,
        name: userData.name || userData.given_name || userData.email.split('@')[0],
        email: userData.email,
        avatar: userData.picture || '',
        provider: 'google'
      };
    } catch (error) {
      console.error('Google OAuth Callback Error:', error);
      return res.status(500).send(`로그인 오류가 발생했습니다: ${error.message}`);
    }
  }

  if (userProfile) {
    const sessionId = crypto.randomBytes(16).toString('hex');
    sessions[sessionId] = userProfile;
    res.setHeader('Set-Cookie', `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
    res.redirect('/');
  } else {
    res.redirect('/?error=google_auth_failed');
  }
});

// Kakao OAuth Authorization
app.get('/auth/kakao', (req, res) => {
  const redirectBase = process.env.REDIRECT_URI_BASE || `http://localhost:${PORT}`;
  const redirectUri = `${redirectBase}/auth/kakao/callback`;

  if (isConfigured('kakao')) {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?` +
      `client_id=${encodeURIComponent(process.env.KAKAO_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code`;
    res.redirect(kakaoAuthUrl);
  } else {
    res.redirect(`/mock-login.html?provider=kakao&redirect_uri=${encodeURIComponent(redirectUri)}`);
  }
});

// Kakao OAuth Callback
app.get('/auth/kakao/callback', async (req, res) => {
  const { code, mock, name, email, avatar } = req.query;
  const redirectBase = process.env.REDIRECT_URI_BASE || `http://localhost:${PORT}`;
  const redirectUri = `${redirectBase}/auth/kakao/callback`;

  let userProfile = null;

  if (mock === 'true' || !isConfigured('kakao')) {
    userProfile = {
      id: 'mock-kakao-' + Date.now(),
      name: name || '이몽룡 (Kakao Mock)',
      email: email || 'mock-kakao@example.com',
      avatar: avatar || '',
      provider: 'kakao'
    };
  } else if (code) {
    try {
      const bodyParams = {
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID,
        redirect_uri: redirectUri,
        code
      };
      if (process.env.KAKAO_CLIENT_SECRET && !process.env.KAKAO_CLIENT_SECRET.startsWith('your_')) {
        bodyParams.client_secret = process.env.KAKAO_CLIENT_SECRET;
      }

      const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
        body: new URLSearchParams(bodyParams)
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Failed to exchange Kakao OAuth token: ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch Kakao user profile');
      }

      const userData = await userResponse.json();
      const kakaoAccount = userData.kakao_account || {};
      const properties = userData.properties || {};

      userProfile = {
        id: String(userData.id),
        name: properties.nickname || kakaoAccount.profile?.nickname || 'Kakao User',
        email: kakaoAccount.email || `${userData.id}@kakao.com`,
        avatar: properties.thumbnail_image || kakaoAccount.profile?.thumbnail_image_url || '',
        provider: 'kakao'
      };
    } catch (error) {
      console.error('Kakao OAuth Callback Error:', error);
      return res.status(500).send(`로그인 오류가 발생했습니다: ${error.message}`);
    }
  }

  if (userProfile) {
    const sessionId = crypto.randomBytes(16).toString('hex');
    sessions[sessionId] = userProfile;
    res.setHeader('Set-Cookie', `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
    res.redirect('/');
  } else {
    res.redirect('/?error=kakao_auth_failed');
  }
});

// Authentication Status API
app.get('/api/auth/me', (req, res) => {
  if (req.user) {
    res.json({ loggedIn: true, user: req.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// Logout API
app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.cookies.session_id;
  if (sessionId) {
    delete sessions[sessionId];
  }
  res.setHeader('Set-Cookie', 'session_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.json({ success: true });
});

// Donations store (in-memory)
const donations = []; // { id, userId, projectId, amount, paymentMethod, status, createdAt }

// 1. POST /api/projects/:id/sponsor
app.post('/api/projects/:id/sponsor', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  const projectId = parseInt(req.params.id, 10);
  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
  }

  const { amount, paymentMethod } = req.body;
  const parsedAmount = parseInt(amount, 10);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: '올바른 후원 금액을 입력해주세요.' });
  }

  // Create donation record
  const donation = {
    id: 'donation-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    userId: req.user.id,
    projectId: projectId,
    amount: parsedAmount,
    paymentMethod: paymentMethod || '신용카드',
    status: 'holding', // holding, released, refunded
    createdAt: new Date().toISOString()
  };
  donations.push(donation);

  // Update project current amount & progress percentage
  project.currentAmount = (project.currentAmount || 0) + parsedAmount;
  project.percentFunded = Math.round((project.currentAmount / project.goalAmount) * 100);

  res.json({ success: true, donation, project });
});

// 2. POST /api/projects (Register a new project)
app.post('/api/projects', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  const { title, category, goalAmount, story, emoji, gradient, daysLeft, escrowPlan } = req.body;
  const parsedGoal = parseInt(goalAmount, 10);
  const parsedDays = parseInt(daysLeft, 10) || 30;

  if (!title || !category || isNaN(parsedGoal) || parsedGoal <= 0 || !story) {
    return res.status(400).json({ error: '필수 정보를 모두 올바르게 입력해주세요.' });
  }

  const newProject = {
    id: projects.length + 1,
    title,
    category,
    hostName: req.user.name,
    trustTemperature: 36.5, // starting trust temp
    successCount: 0,
    status: '심사 중',
    goalAmount: parsedGoal,
    currentAmount: 0,
    percentFunded: 0,
    daysLeft: parsedDays,
    gradient: gradient || 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    emoji: emoji || '🎂',
    story: story,
    escrowPlan: escrowPlan || '',
    community: { notices: [], polls: [] },
    refundPolicy: '목표 금액 미달성 시 전액 자동 환불됩니다. 펀딩 종료 후 7영업일 이내 결제 수단으로 환불 처리됩니다.'
  };

  projects.push(newProject);
  res.json({ success: true, project: newProject });
});

// 3. GET /api/users/me/escrow
app.get('/api/users/me/escrow', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  // Get all donations sponsored by user, joined with project metadata
  const userDonations = donations
    .filter((d) => d.userId === req.user.id)
    .map((d) => {
      const p = projects.find((proj) => proj.id === d.projectId);
      return {
        ...d,
        projectTitle: p ? p.title : '알 수 없는 프로젝트',
        projectStatus: p ? p.status : '알 수 없음',
        projectGradient: p ? p.gradient : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        projectEmoji: p ? p.emoji : '❓'
      };
    });

  // Get projects hosted by user
  const userProjects = projects.filter((p) => p.hostName === req.user.name);

  res.json({
    success: true,
    donations: userDonations,
    createdProjects: userProjects
  });
});

// 4. POST /api/donations/:id/refund
app.post('/api/donations/:id/refund', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  const donationId = req.params.id;
  const donation = donations.find((d) => d.id === donationId && d.userId === req.user.id);
  if (!donation) {
    return res.status(404).json({ error: '후원 내역을 찾을 수 없습니다.' });
  }

  if (donation.status !== 'holding') {
    return res.status(400).json({ error: '이미 환불되거나 정산 완료된 내역은 환불할 수 없습니다.' });
  }

  const project = projects.find((p) => p.id === donation.projectId);
  if (!project) {
    return res.status(404).json({ error: '연관된 프로젝트를 찾을 수 없습니다.' });
  }

  // Check if project status allows refunding (e.g. still in funding)
  if (project.status !== '펀딩 진행 중' && project.status !== '심사 중') {
    return res.status(400).json({ error: '펀딩 진행 중인 프로젝트만 취소/환불할 수 있습니다.' });
  }

  // Mark donation as refunded
  donation.status = 'refunded';

  // Subtract amount from project
  project.currentAmount = Math.max(0, (project.currentAmount || 0) - donation.amount);
  project.percentFunded = Math.round((project.currentAmount / project.goalAmount) * 100);

  res.json({ success: true, donation, project });
});


app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/hero-slides', (req, res) => {
  res.json(heroSlides);
});

app.get('/api/projects/featured', (req, res) => {
  const featured = projects.filter((p) => p.featured);
  res.json(featured);
});

app.get('/api/projects/popular', (req, res) => {
  const popular = projects
    .filter((p) => p.popularRank != null)
    .sort((a, b) => a.popularRank - b.popularRank);
  res.json(popular);
});

app.get('/api/projects/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const project = projects.find((p) => p.id === id);
  if (!project) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(project);
});

app.listen(PORT, () => {
  console.log(`Duckrowd demo server running at http://localhost:${PORT}`);
});
