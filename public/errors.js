// Shared API error handling & toast UX for Duckrowd

function ensureToastContainer() {
  let container = document.getElementById('toast-container');
  if (container) return container;

  container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  container.setAttribute('aria-live', 'polite');
  document.body.appendChild(container);
  return container;
}

function showToast(message, type = 'error', durationMs = 4500) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');

  const icons = { error: '⚠️', warning: '🔒', success: '✓', info: 'ℹ️' };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.error}</span>
    <span class="toast-message">${message}</span>
    <button type="button" class="toast-close" aria-label="닫기">&times;</button>
  `;

  const remove = () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 250);
  };

  toast.querySelector('.toast-close').addEventListener('click', remove);
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(remove, durationMs);
}

async function parseApiError(res) {
  try {
    const data = await res.json();
    return data.error || data.message || defaultMessageForStatus(res.status);
  } catch {
    return defaultMessageForStatus(res.status);
  }
}

function defaultMessageForStatus(status) {
  if (status === 401) return '로그인이 필요합니다.';
  if (status === 403) return '접근 권한이 없습니다.';
  if (status === 404) return '요청한 리소스를 찾을 수 없습니다.';
  if (status >= 500) return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  return '요청 처리에 실패했습니다.';
}

async function handleApiResponse(res) {
  if (res.ok) {
    const data = await res.json();
    return { ok: true, data, status: res.status };
  }

  const message = await parseApiError(res);

  if (res.status === 401) {
    showToast(message, 'warning');
    if (typeof showLoginModal === 'function') {
      showLoginModal();
    }
    return { ok: false, status: 401, message };
  }

  if (res.status === 403) {
    showToast(message, 'error');
    return { ok: false, status: 403, message };
  }

  if (res.status === 404) {
    showToast(message, 'error');
    return { ok: false, status: 404, message };
  }

  if (res.status >= 500) {
    showToast(message, 'error');
    return { ok: false, status: res.status, message };
  }

  showToast(message, 'error');
  return { ok: false, status: res.status, message };
}

window.showToast = showToast;
window.handleApiResponse = handleApiResponse;
window.parseApiError = parseApiError;
