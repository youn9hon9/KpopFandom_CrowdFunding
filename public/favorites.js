const FavoriteStore = {
  ids: new Set(),
  loaded: false,

  async load() {
    if (!window.currentUser) {
      this.ids = new Set();
      this.loaded = true;
      return;
    }
    try {
      const res = await fetch('/api/users/me/favorites/ids');
      if (!res.ok) {
        this.ids = new Set();
        this.loaded = true;
        return;
      }
      const data = await res.json();
      this.ids = new Set(data.ids || []);
      this.loaded = true;
    } catch {
      this.ids = new Set();
      this.loaded = true;
    }
  },

  has(projectId) {
    return this.ids.has(Number(projectId));
  },

  async toggle(projectId) {
    const id = Number(projectId);
    if (!window.currentUser) {
      if (typeof showToast === 'function') showToast('관심 프로젝트는 로그인 후 이용할 수 있습니다.', 'warning');
      if (typeof showLoginModal === 'function') showLoginModal();
      return null;
    }

    const favorited = this.has(id);
    const res = await fetch(`/api/users/me/favorites/${id}`, {
      method: favorited ? 'DELETE' : 'POST'
    });
    const result = typeof handleApiResponse === 'function' ? await handleApiResponse(res) : { ok: res.ok };
    if (!result.ok) return null;

    if (favorited) {
      this.ids.delete(id);
      if (typeof showToast === 'function') showToast('관심 프로젝트에서 제거했습니다.', 'info');
    } else {
      this.ids.add(id);
      if (typeof showToast === 'function') showToast('관심 프로젝트에 추가했습니다.', 'success');
    }

    document.querySelectorAll(`.btn-favorite[data-project-id="${id}"]`).forEach((btn) => {
      btn.classList.toggle('active', this.has(id));
      btn.setAttribute('aria-pressed', this.has(id) ? 'true' : 'false');
      btn.title = this.has(id) ? '관심 해제' : '관심 프로젝트에 추가';
    });

    return !favorited;
  },

  bindButtons(root = document) {
    root.querySelectorAll('.btn-favorite').forEach((btn) => {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      const id = btn.dataset.projectId;
      btn.classList.toggle('active', this.has(id));
      btn.setAttribute('aria-pressed', this.has(id) ? 'true' : 'false');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggle(id);
      });
    });
  }
};

window.FavoriteStore = FavoriteStore;
