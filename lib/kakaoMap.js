const KAKAO_REST_KEY = process.env.KAKAO_CLIENT_ID || process.env.KAKAO_REST_API_KEY || '';

function isGeocodeConfigured() {
  return Boolean(KAKAO_REST_KEY);
}

function getJavascriptKey() {
  return process.env.KAKAO_MAP_JAVASCRIPT_KEY || process.env.KAKAO_JAVASCRIPT_KEY || '';
}

async function geocodeAddress(query) {
  const trimmed = String(query || '').trim();
  if (!trimmed) return null;
  if (!isGeocodeConfigured()) return null;

  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(trimmed)}&size=1`;
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` }
  });

  if (!res.ok) {
    console.warn('[KakaoMap] geocode failed:', res.status, await res.text().catch(() => ''));
    return null;
  }

  const data = await res.json();
  const place = data.documents?.[0];
  if (!place) return null;

  return {
    lat: parseFloat(place.y),
    lng: parseFloat(place.x),
    placeName: place.place_name || trimmed,
    address: place.road_address_name || place.address_name || trimmed
  };
}

function buildMapSearchUrl(query) {
  return `https://map.kakao.com/link/search/${encodeURIComponent(String(query || '').trim())}`;
}

function buildMapLinkUrl(lat, lng, label) {
  if (lat != null && lng != null) {
    const name = encodeURIComponent(label || '장소');
    return `https://map.kakao.com/link/map/${name},${lat},${lng}`;
  }
  return buildMapSearchUrl(label);
}

module.exports = {
  isGeocodeConfigured,
  getJavascriptKey,
  geocodeAddress,
  buildMapSearchUrl,
  buildMapLinkUrl
};
