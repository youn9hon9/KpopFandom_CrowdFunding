let mapConfigCache = null;
let kakaoSdkPromise = null;

async function getMapConfig() {
  if (!mapConfigCache) {
    const res = await fetch('/api/config/public');
    mapConfigCache = await res.json();
  }
  return mapConfigCache;
}

function loadKakaoSdk(appkey) {
  if (window.kakao && window.kakao.maps) {
    return Promise.resolve();
  }
  if (kakaoSdkPromise) return kakaoSdkPromise;

  kakaoSdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appkey)}&autoload=false`;
    script.onload = () => {
      window.kakao.maps.load(resolve);
    };
    script.onerror = () => reject(new Error('카카오맵 SDK 로드 실패'));
    document.head.appendChild(script);
  });

  return kakaoSdkPromise;
}

async function resolveScheduleCoords(el) {
  const lat = parseFloat(el.dataset.lat);
  const lng = parseFloat(el.dataset.lng);
  if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
    return { lat, lng, label: el.dataset.label || el.dataset.location || '장소' };
  }

  const location = el.dataset.location;
  if (!location) return null;

  try {
    const res = await fetch(`/api/maps/geocode?query=${encodeURIComponent(location)}`);
    const data = await res.json();
    if (data.lat != null && data.lng != null) {
      return { lat: data.lat, lng: data.lng, label: data.placeName || location };
    }
  } catch (err) {
    console.warn('geocode failed', err);
  }

  return { fallbackUrl: `https://map.kakao.com/link/search/${encodeURIComponent(location)}`, label: location };
}

function renderMapFallback(el, url, label) {
  el.classList.add('schedule-map--fallback');
  el.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="schedule-map-link">카카오맵에서 「${label}」 보기 →</a>`;
}

async function initKakaoScheduleMaps() {
  const containers = document.querySelectorAll('.schedule-map');
  if (!containers.length) return;

  const config = await getMapConfig();

  for (const el of containers) {
    if (el.dataset.mapReady === '1') continue;

    const coords = await resolveScheduleCoords(el);
    if (!coords) continue;

    if (coords.fallbackUrl) {
      renderMapFallback(el, coords.fallbackUrl, coords.label);
      el.dataset.mapReady = '1';
      continue;
    }

    if (!config.kakaoMapKey) {
      const url = `https://map.kakao.com/link/map/${encodeURIComponent(coords.label)},${coords.lat},${coords.lng}`;
      renderMapFallback(el, url, coords.label);
      el.dataset.mapReady = '1';
      continue;
    }

    try {
      await loadKakaoSdk(config.kakaoMapKey);
      el.style.height = '200px';
      const position = new window.kakao.maps.LatLng(coords.lat, coords.lng);
      const map = new window.kakao.maps.Map(el, { center: position, level: 3 });
      const marker = new window.kakao.maps.Marker({ position });
      marker.setMap(map);
      el.dataset.mapReady = '1';
    } catch (err) {
      console.warn('Kakao map init failed', err);
      const url = `https://map.kakao.com/link/map/${encodeURIComponent(coords.label)},${coords.lat},${coords.lng}`;
      renderMapFallback(el, url, coords.label);
      el.dataset.mapReady = '1';
    }
  }
}

window.initKakaoScheduleMaps = initKakaoScheduleMaps;
