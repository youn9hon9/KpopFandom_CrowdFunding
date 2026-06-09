const crypto = require('crypto');
const client = require('openid-client');
const db = require('./database');
const oauthState = require('./oauthState');

let googleConfig = null;

function getRedirectBase() {
  const port = process.env.PORT || 3000;
  return process.env.REDIRECT_URI_BASE || `http://localhost:${port}`;
}

function isPlaceholder(value) {
  return !value || value.includes('your_');
}

function isGoogleConfigured() {
  return (
    !isPlaceholder(process.env.REDIRECT_URI_BASE) &&
    !isPlaceholder(process.env.GOOGLE_CLIENT_ID) &&
    !isPlaceholder(process.env.GOOGLE_CLIENT_SECRET)
  );
}

function isKakaoConfigured() {
  return (
    !isPlaceholder(process.env.REDIRECT_URI_BASE) &&
    !isPlaceholder(process.env.KAKAO_CLIENT_ID)
  );
}

function getAuthStatus() {
  return {
    google: isGoogleConfigured(),
    kakao: isKakaoConfigured(),
    redirectBase: getRedirectBase()
  };
}

function saveOAuthState(state, payload) {
  oauthState.saveOAuthState(db.getDb, state, payload);
}

function consumeOAuthState(state, provider) {
  return oauthState.consumeOAuthState(db.getDb, state, provider);
}

async function initGoogleOAuth() {
  if (!isGoogleConfigured()) {
    googleConfig = null;
    return null;
  }

  const redirectUri = `${getRedirectBase()}/auth/google/callback`;
  googleConfig = await client.discovery(
    new URL('https://accounts.google.com'),
    process.env.GOOGLE_CLIENT_ID,
    { redirect_uris: [redirectUri] },
    client.ClientSecretPost(process.env.GOOGLE_CLIENT_SECRET)
  );
  return googleConfig;
}

async function buildGoogleAuthRedirect() {
  if (!googleConfig) {
    throw new Error('Google OAuth is not configured');
  }

  const redirectUri = `${getRedirectBase()}/auth/google/callback`;
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();

  saveOAuthState(state, { provider: 'google', codeVerifier });

  const redirectTo = client.buildAuthorizationUrl(googleConfig, {
    redirect_uri: redirectUri,
    scope: 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state
  });

  return redirectTo.href;
}

async function handleGoogleCallback(req) {
  if (!googleConfig) {
    throw new Error('Google OAuth is not configured');
  }

  const callbackUrl = new URL(`${getRedirectBase()}${req.originalUrl}`);
  const state = callbackUrl.searchParams.get('state');
  if (!state) {
    throw new Error('OAuth state가 없습니다. 다시 로그인해 주세요.');
  }

  const stored = consumeOAuthState(state, 'google');
  if (!stored) {
    throw new Error('OAuth state가 만료되었거나 일치하지 않습니다. 다시 로그인해 주세요.');
  }

  const tokens = await client.authorizationCodeGrant(googleConfig, callbackUrl, {
    pkceCodeVerifier: stored.codeVerifier,
    expectedState: state
  });

  const claims = tokens.claims();
  let profile = {
    id: claims?.sub,
    name: claims?.name || claims?.given_name || claims?.email?.split('@')[0] || 'Google User',
    email: claims?.email || '',
    avatar: claims?.picture || '',
    provider: 'google'
  };

  if (tokens.access_token) {
    try {
      const userInfo = await client.fetchUserInfo(
        googleConfig,
        tokens.access_token,
        claims?.sub || client.skipSubjectCheck
      );
      profile = {
        id: userInfo.sub || profile.id,
        name: userInfo.name || userInfo.given_name || profile.name,
        email: userInfo.email || profile.email,
        avatar: userInfo.picture || profile.avatar,
        provider: 'google'
      };
    } catch {
      // ID token claims만으로도 로그인 가능
    }
  }

  if (!profile.id) {
    throw new Error('Google 사용자 정보를 가져오지 못했습니다.');
  }

  return profile;
}

function buildKakaoAuthRedirect() {
  if (!isKakaoConfigured()) {
    throw new Error('Kakao OAuth is not configured');
  }

  const redirectUri = `${getRedirectBase()}/auth/kakao/callback`;
  const state = crypto.randomBytes(16).toString('hex');
  saveOAuthState(state, { provider: 'kakao' });

  return (
    `https://kauth.kakao.com/oauth/authorize?` +
    `client_id=${encodeURIComponent(process.env.KAKAO_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&state=${encodeURIComponent(state)}`
  );
}

async function handleKakaoCallback(req) {
  if (!isKakaoConfigured()) {
    throw new Error('Kakao OAuth is not configured');
  }

  const { code, state, error, error_description: errorDescription } = req.query;
  if (error) {
    throw new Error(errorDescription || error);
  }
  if (!code) {
    throw new Error('Kakao authorization code가 없습니다.');
  }
  if (!state) {
    throw new Error('OAuth state가 없습니다. 다시 로그인해 주세요.');
  }

  const stored = consumeOAuthState(state, 'kakao');
  if (!stored) {
    throw new Error('OAuth state가 만료되었거나 일치하지 않습니다. 다시 로그인해 주세요.');
  }

  const redirectUri = `${getRedirectBase()}/auth/kakao/callback`;
  const bodyParams = {
    grant_type: 'authorization_code',
    client_id: process.env.KAKAO_CLIENT_ID,
    redirect_uri: redirectUri,
    code
  };

  if (process.env.KAKAO_CLIENT_SECRET && !isPlaceholder(process.env.KAKAO_CLIENT_SECRET)) {
    bodyParams.client_secret = process.env.KAKAO_CLIENT_SECRET;
  }

  const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: new URLSearchParams(bodyParams)
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Kakao 토큰 교환 실패: ${errorText}`);
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
    throw new Error('Kakao 사용자 정보를 가져오지 못했습니다.');
  }

  const userData = await userResponse.json();
  const kakaoAccount = userData.kakao_account || {};
  const properties = userData.properties || {};

  return {
    id: String(userData.id),
    name: properties.nickname || kakaoAccount.profile?.nickname || 'Kakao User',
    email: kakaoAccount.email || `${userData.id}@kakao.user`,
    avatar: properties.thumbnail_image || kakaoAccount.profile?.thumbnail_image_url || '',
    provider: 'kakao'
  };
}

function createSession(res, sessionStore, userProfile) {
  const sessionId = crypto.randomBytes(16).toString('hex');
  sessionStore.set(sessionId, userProfile);
  res.setHeader('Set-Cookie', `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
}

module.exports = {
  initGoogleOAuth,
  buildGoogleAuthRedirect,
  handleGoogleCallback,
  buildKakaoAuthRedirect,
  handleKakaoCallback,
  createSession,
  getAuthStatus,
  isGoogleConfigured,
  isKakaoConfigured
};
