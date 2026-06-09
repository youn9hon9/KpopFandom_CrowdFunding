// Shared Authentication and Escrow Logic for Duckrowd

function getInitialLetter(name) {
  return name ? name.trim().charAt(0) : '?';
}

function formatCurrency(amount) {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

// ----------------------------------------------------
// 1. LOGIN MODAL INJECTION & MANAGEMENT
// ----------------------------------------------------
function injectLoginModal() {
  if (document.getElementById('login-modal-overlay')) return;

  const modalHtml = `
    <div class="modal-overlay" id="login-modal-overlay">
      <div class="modal-box">
        <button type="button" class="modal-close-btn" id="login-modal-close">&times;</button>
        <div class="modal-logo">Duckrowd</div>
        <p class="modal-title">간편하게 로그인하고<br>최애의 이벤트를 후원해보세요!</p>
        <div class="social-login-list">
          <a href="/auth/google" class="btn-social btn-google">
            <span class="social-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </span>
            Google로 시작하기
          </a>
          <a href="/auth/kakao" class="btn-social btn-kakao">
            <span class="social-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.27 6.054-.188.702-.68 2.531-.777 2.92-.122.493.18.487.378.355.155-.104 2.474-1.68 3.474-2.355C10.875 16.54 11.432 16.58 12 16.58c4.97 0 9-3.185 9-7.115S16.97 3 12 3z" fill="#3C1E1E"/>
              </svg>
            </span>
            Kakao로 시작하기
          </a>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Bind close buttons
  const overlay = document.getElementById('login-modal-overlay');
  const closeBtn = document.getElementById('login-modal-close');
  
  const closeModal = () => {
    overlay.classList.remove('show');
    setTimeout(() => { overlay.style.display = 'none'; }, 250);
  };

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

function showLoginModal() {
  const overlay = document.getElementById('login-modal-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  overlay.offsetHeight; // trigger reflow
  overlay.classList.add('show');
}


// ----------------------------------------------------
// 2. ESCROW CHECKOUT MODAL INJECTION & MANAGEMENT
// ----------------------------------------------------
function injectEscrowCheckoutModal(projectId, projectTitle, hostName, trustTemp) {
  // Remove existing checkout modal if any
  const existing = document.getElementById('checkout-modal-overlay');
  if (existing) existing.remove();

  const checkoutHtml = `
    <div class="modal-overlay" id="checkout-modal-overlay">
      <div class="modal-box modal-box--wide modal-box--form">
        <div class="escrow-loading-overlay" id="checkout-loading">
          <div class="escrow-spinner" id="checkout-spinner"></div>
          <div class="escrow-success-icon" id="checkout-success-icon" hidden>✓</div>
          <p class="escrow-loading-text" id="checkout-loading-text">결제 처리 중...</p>
        </div>

        <button type="button" class="modal-close-btn" id="checkout-modal-close" aria-label="닫기">&times;</button>
        <header class="modal-header">
          <p class="modal-eyebrow">Duckrowd Safe Pay</p>
          <h2 class="modal-heading">안전 후원 결제</h2>
        </header>

        <div class="checkout-project-card">
          <p class="checkout-project-title">${projectTitle}</p>
          <p class="checkout-project-meta">총대 ${hostName} · 🌡️ 덕질 온도 ${trustTemp}°</p>
        </div>

        <form id="checkout-form" class="modal-form">
          <div class="form-group">
            <label class="form-label" for="checkout-amount">후원 금액</label>
            <div class="escrow-amount-selector">
              <button type="button" class="escrow-amount-btn" data-val="10000">1만 원</button>
              <button type="button" class="escrow-amount-btn active" data-val="30000">3만 원</button>
              <button type="button" class="escrow-amount-btn" data-val="50000">5만 원</button>
            </div>
            <div class="amount-input-wrap">
              <input type="number" id="checkout-amount" class="form-input form-input--amount" required value="30000" min="1000" step="1000" placeholder="직접 입력">
              <span class="amount-input-suffix">원</span>
            </div>
          </div>

          <div class="escrow-notice-box">
            <span class="escrow-notice-icon">🛡️</span>
            <div class="escrow-notice-text">
              <strong>안전 결제 안내</strong>
              <p>후원금은 펀딩 성공 시까지 보관되며, 미달성·취소 시 <strong>100% 환불</strong>됩니다. 성공 후에도 단계별 분할 정산됩니다.</p>
            </div>
          </div>

          <div class="form-group">
            <span class="form-label">결제 수단</span>
            <div class="payment-method-grid">
              <button type="button" class="payment-card active" data-method="신용카드">
                <span class="payment-card-icon">💳</span>
                <span>신용카드</span>
              </button>
              <button type="button" class="payment-card" data-method="간편계좌이체">
                <span class="payment-card-icon">🏦</span>
                <span>계좌이체</span>
              </button>
              <button type="button" class="payment-card" data-method="카카오페이">
                <span class="payment-card-icon">💛</span>
                <span>카카오페이</span>
              </button>
              <button type="button" class="payment-card" data-method="토스페이">
                <span class="payment-card-icon">💙</span>
                <span>토스페이</span>
              </button>
            </div>
          </div>

          <div class="payment-terms">
            <label class="term-checkbox-label">
              <input type="checkbox" id="term-agree-1" required checked>
              <span>안전 결제 및 환불 정책 동의 (필수)</span>
            </label>
            <label class="term-checkbox-label">
              <input type="checkbox" id="term-agree-2" required checked>
              <span>개인정보 제3자 제공 동의 (필수)</span>
            </label>
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-lg">후원 결제하기</button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', checkoutHtml);

  const overlay = document.getElementById('checkout-modal-overlay');
  const closeBtn = document.getElementById('checkout-modal-close');
  const form = document.getElementById('checkout-form');
  const amountInput = document.getElementById('checkout-amount');
  const amountBtns = document.querySelectorAll('.escrow-amount-btn');
  const paymentCards = document.querySelectorAll('#checkout-form .payment-card');

  // Amount preset click logic
  amountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      amountBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      amountInput.value = btn.dataset.val;
    });
  });

  // Custom amount input check logic
  amountInput.addEventListener('input', () => {
    amountBtns.forEach(b => {
      if (b.dataset.val === amountInput.value) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  });

  // Payment method select logic
  let selectedMethod = '신용카드';
  paymentCards.forEach((card) => {
    card.addEventListener('click', () => {
      paymentCards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      selectedMethod = card.dataset.method;
    });
  });

  // Open modal animation
  overlay.style.display = 'flex';
  overlay.offsetHeight;
  overlay.classList.add('show');

  // Close modal logic
  const closeModal = () => {
    overlay.classList.remove('show');
    setTimeout(() => { overlay.remove(); }, 250);
  };
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Submit flow (Simulated Escrow Payment)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const finalAmount = parseInt(amountInput.value, 10);
    
    // Show Loading
    const loadingOverlay = document.getElementById('checkout-loading');
    const loadingText = document.getElementById('checkout-loading-text');
    const spinner = document.getElementById('checkout-spinner');
    const successIcon = document.getElementById('checkout-success-icon');

    loadingOverlay.classList.add('show');
    loadingText.textContent = '결제 확인 중...';

    try {
      // Send to server
      const res = await fetch(`/api/projects/${projectId}/sponsor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: finalAmount, paymentMethod: selectedMethod })
      });

      const result = await handleApiResponse(res);
      if (!result.ok) {
        loadingOverlay.classList.remove('show');
        return;
      }

      const data = result.data;

      // Show success animation
      setTimeout(() => {
        spinner.style.display = 'none';
        successIcon.style.display = 'block';
        loadingText.textContent = `${formatCurrency(finalAmount)} 후원 결제 완료!`;
        
        setTimeout(() => {
          closeModal();
          // Reload page to reflect new amounts
          window.location.reload();
        }, 1500);
      }, 1200);

    } catch (err) {
      showToast(err.message || '결제 처리에 실패했습니다.', 'error');
      loadingOverlay.classList.remove('show');
    }
  });
}


// ----------------------------------------------------
// 3. PROJECT CREATION WIZARD MODAL
// ----------------------------------------------------
function injectProjectWizardModal() {
  const existing = document.getElementById('wizard-modal-overlay');
  if (existing) existing.remove();

  const wizardHtml = `
    <div class="modal-overlay" id="wizard-modal-overlay">
      <div class="modal-box modal-box--wide modal-box--form">
        <div class="escrow-loading-overlay" id="wizard-loading">
          <div class="escrow-spinner" id="wizard-spinner"></div>
          <div class="escrow-success-icon" id="wizard-success-icon" hidden>✓</div>
          <p class="escrow-loading-text" id="wizard-loading-text">신청서 심사 요청 중...</p>
        </div>

        <button type="button" class="modal-close-btn" id="wizard-modal-close" aria-label="닫기">&times;</button>
        <header class="modal-header">
          <p class="modal-eyebrow">Duckrowd Studio</p>
          <h2 class="modal-heading">새 프로젝트 개설 신청</h2>
        </header>

        <div class="wizard-steps">
          <div class="wizard-step active" data-step="1">
            <span class="step-num">1</span>
            <span class="step-label">기본 정보</span>
          </div>
          <div class="wizard-step" data-step="2">
            <span class="step-num">2</span>
            <span class="step-label">예산 및 정산</span>
          </div>
          <div class="wizard-step" data-step="3">
            <span class="step-num">3</span>
            <span class="step-label">결제·환불 약정</span>
          </div>
        </div>

        <form id="wizard-form" class="modal-form">
          <div class="wizard-panel active" id="panel-1">
            <div class="form-group">
              <label for="wiz-title" class="form-label">프로젝트 제목</label>
              <input type="text" id="wiz-title" class="form-input" required placeholder="예: 홍대입구역 2호선 생일 광고 전광판 이벤트">
            </div>
            <div class="form-row form-row--2">
              <div class="form-group">
                <label for="wiz-category" class="form-label">카테고리</label>
                <select id="wiz-category" class="form-input form-input--select" required>
                  <option value="생일카페">🎂 생일카페</option>
                  <option value="지하철광고" selected>🚇 지하철광고</option>
                  <option value="커피차">☕ 커피차</option>
                  <option value="전시회">🖼️ 전시회</option>
                  <option value="컵홀더">🥤 컵홀더</option>
                  <option value="응원봉">✨ 응원봉</option>
                  <option value="앨범공구">💿 앨범공구</option>
                  <option value="기타">🏳️ 기타</option>
                </select>
              </div>
              <div class="form-group">
                <label for="wiz-emoji" class="form-label">대표 이모지</label>
                <input type="text" id="wiz-emoji" class="form-input" required value="🚇" placeholder="이모지 한 개">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">대표 비주얼 그라데이션 테마</label>
              <div class="gradient-selector" id="wiz-gradient-selector">
                <div class="gradient-option active" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)" data-grad="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"></div>
                <div class="gradient-option" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" data-grad="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"></div>
                <div class="gradient-option" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" data-grad="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"></div>
                <div class="gradient-option" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)" data-grad="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"></div>
              </div>
            </div>
            <div class="form-group">
              <label for="wiz-cover-file" class="form-label">대표 이미지 (선택)</label>
              <input type="file" id="wiz-cover-file" class="form-input form-input--file" accept="image/jpeg,image/png,image/webp,image/gif">
              <p class="form-hint">JPEG·PNG·WebP·GIF, 최대 2MB. 미선택 시 이모지·그라데이션이 표시됩니다.</p>
              <div id="wiz-cover-preview" class="cover-preview" hidden></div>
            </div>
            <div class="form-group">
              <label for="wiz-story" class="form-label">프로젝트 스토리</label>
              <textarea id="wiz-story" class="form-input form-input--textarea" required placeholder="후원자들에게 프로젝트 취지와 상세 일정을 공유해보세요."></textarea>
            </div>
          </div>

          <div class="wizard-panel" id="panel-2">
            <div class="form-row form-row--goal">
              <div class="form-group">
                <label for="wiz-goal" class="form-label">목표 금액</label>
                <div class="amount-input-wrap">
                  <input type="number" id="wiz-goal" class="form-input form-input--amount" required min="10000" step="10000" value="5000000" placeholder="5000000">
                  <span class="amount-input-suffix">원</span>
                </div>
              </div>
              <div class="form-group">
                <label for="wiz-days" class="form-label">펀딩 기간 (일)</label>
                <input type="number" id="wiz-days" class="form-input" required min="1" max="90" value="30" placeholder="30">
              </div>
            </div>
            <div class="form-group">
              <label for="wiz-escrow-plan" class="form-label">예산·정산 계획</label>
              <textarea id="wiz-escrow-plan" class="form-input form-input--textarea form-input--tall" required placeholder="예:&#10;- 1단계 (선금 40%): 전광판 예약 계약금&#10;- 2단계 (잔금 60%): 광고 게재 당일 잔금 정산"></textarea>
              <p class="form-hint">구체적이고 실현 가능한 정산 조건이어야 심사를 통과할 수 있습니다.</p>
            </div>
          </div>

          <div class="wizard-panel" id="panel-3">
            <div class="escrow-notice-box">
              <span class="escrow-notice-icon">🛡️</span>
              <div class="escrow-notice-text">
                <strong>덕라우드 안전 결제 이용 규칙</strong>
                <br>1. <strong>100% 자동 환불 약정</strong>: 목표 금액 미달성 시 모든 후원금은 자동 승인 취소 및 환불됩니다.
                <br>2. <strong>단계별 분할 정산</strong>: 제출한 정산 계획안에 따라 영수증 및 증빙 자료 제출 확인 후 분할 송금됩니다.
                <br>3. <strong>투명 정산 및 대행</strong>: 예산 유용이나 횡령 의혹 발생 시 플랫폼의 소명 요구가 동반되며, 미소명 시 후원금 지급이 정지됩니다.
              </div>
            </div>
            <div class="payment-terms payment-terms--spaced">
              <label class="term-checkbox-label">
                <input type="checkbox" id="wiz-agree-1" required checked>
                <span>안전 결제 심사 기준 및 단계별 정산 규칙을 확인하였으며 이에 동의합니다. (필수)</span>
              </label>
              <label class="term-checkbox-label">
                <input type="checkbox" id="wiz-agree-2" required checked>
                <span>프로젝트 중도 무산 시 후원자들에게 즉각 공지하고 자동 환불 절차에 응할 것을 동의합니다. (필수)</span>
              </label>
              <label class="term-checkbox-label">
                <input type="checkbox" id="wiz-agree-3" required checked>
                <span>모금 자금의 사적 유용 및 횡령 시 민형사상 법적 책임이 주최자 본인에게 있음을 명심합니다. (필수)</span>
              </label>
            </div>
          </div>

          <div class="wizard-footer">
            <button type="button" class="btn btn-ghost btn-outline" id="wiz-prev" hidden>이전</button>
            <button type="button" class="btn btn-primary" id="wiz-next">다음</button>
            <button type="submit" class="btn btn-primary" id="wiz-submit" hidden>심사 신청하기</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', wizardHtml);

  const overlay = document.getElementById('wizard-modal-overlay');
  const closeBtn = document.getElementById('wizard-modal-close');
  const form = document.getElementById('wizard-form');
  const prevBtn = document.getElementById('wiz-prev');
  const nextBtn = document.getElementById('wiz-next');
  const submitBtn = document.getElementById('wiz-submit');

  const stepEls = document.querySelectorAll('.wizard-step');
  const panelEls = document.querySelectorAll('.wizard-panel');

  // Gradient Selector interaction
  const gradOptions = document.querySelectorAll('.gradient-option');
  let selectedGradient = gradOptions[0].dataset.grad;
  gradOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      gradOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedGradient = opt.dataset.grad;
    });
  });

  // Step state management
  let currentStep = 1;
  const updateWizard = () => {
    // Panels
    panelEls.forEach((p, idx) => p.classList.toggle('active', idx + 1 === currentStep));
    // Indicators
    stepEls.forEach((s, idx) => {
      s.classList.toggle('active', idx + 1 === currentStep);
      s.classList.toggle('completed', idx + 1 < currentStep);
    });

    prevBtn.hidden = currentStep === 1;
    nextBtn.hidden = currentStep === 3;
    submitBtn.hidden = currentStep !== 3;
  };

  // Next step trigger validation
  nextBtn.addEventListener('click', () => {
    // Validate current panel inputs before going next
    const currentPanel = document.getElementById(`panel-${currentStep}`);
    const inputs = currentPanel.querySelectorAll('input, textarea, select');
    let valid = true;
    inputs.forEach(i => {
      if (!i.checkValidity()) {
        i.reportValidity();
        valid = false;
      }
    });

    if (valid) {
      currentStep++;
      updateWizard();
    }
  });

  // Prev step trigger
  prevBtn.addEventListener('click', () => {
    currentStep--;
    updateWizard();
  });

  // Open animation
  overlay.style.display = 'flex';
  overlay.offsetHeight;
  overlay.classList.add('show');

  const closeModal = () => {
    overlay.classList.remove('show');
    setTimeout(() => { overlay.remove(); }, 250);
  };
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  const coverInput = document.getElementById('wiz-cover-file');
  const coverPreview = document.getElementById('wiz-cover-preview');
  if (coverInput && coverPreview) {
    coverInput.addEventListener('change', () => {
      const file = coverInput.files[0];
      if (!file) {
        coverPreview.hidden = true;
        coverPreview.innerHTML = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        coverPreview.hidden = false;
        coverPreview.innerHTML = `<img src="${ev.target.result}" alt="대표 이미지 미리보기">`;
      };
      reader.readAsDataURL(file);
    });
  }

  // Form Submit (Project Register Request)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('wiz-title').value.trim();
    const category = document.getElementById('wiz-category').value;
    const emoji = document.getElementById('wiz-emoji').value.trim();
    const story = document.getElementById('wiz-story').value.trim();
    const goalAmount = parseInt(document.getElementById('wiz-goal').value, 10);
    const daysLeft = parseInt(document.getElementById('wiz-days').value, 10);
    const escrowPlan = document.getElementById('wiz-escrow-plan').value.trim();

    // Show Loading
    const loadingOverlay = document.getElementById('wizard-loading');
    const loadingText = document.getElementById('wizard-loading-text');
    const spinner = document.getElementById('wizard-spinner');
    const successIcon = document.getElementById('wizard-success-icon');

    loadingOverlay.classList.add('show');
    loadingText.textContent = '프로젝트 승인 심사 요청 중...';

    try {
      let coverImage = null;
      if (coverInput?.files?.[0]) {
        const uploadFd = new FormData();
        uploadFd.append('cover', coverInput.files[0]);
        const upRes = await fetch('/api/upload/project-cover', { method: 'POST', body: uploadFd });
        const upResult = await handleApiResponse(upRes);
        if (!upResult.ok) {
          loadingOverlay.classList.remove('show');
          return;
        }
        coverImage = upResult.data.url;
      }

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          emoji,
          story,
          goalAmount,
          daysLeft,
          escrowPlan,
          gradient: selectedGradient,
          coverImage
        })
      });

      const result = await handleApiResponse(res);
      if (!result.ok) {
        loadingOverlay.classList.remove('show');
        return;
      }

      // Success
      setTimeout(() => {
        spinner.style.display = 'none';
        successIcon.style.display = 'block';
        loadingText.textContent = '등록 성공! 심사가 시작됩니다.';
        
        setTimeout(() => {
          closeModal();
          // Redirect to home so they see it in lists
          window.location.href = '/';
        }, 1500);
      }, 1200);

    } catch (err) {
      showToast(err.message || '프로젝트 등록에 실패했습니다.', 'error');
      loadingOverlay.classList.remove('show');
    }
  });
}


function mypageHref(tab) {
  return window.DuckrowdRoutes ? DuckrowdRoutes.mypageUrl(tab) : '/mypage';
}

// ----------------------------------------------------
// 4. SESSION & HEADER STATE SYNC
// ----------------------------------------------------
function setupDetailSponsorButton(project) {
  const sponsorBtn = document.getElementById('detail-sponsor-btn');
  if (!sponsorBtn) return;

  sponsorBtn.addEventListener('click', (e) => {
    e.preventDefault();
    injectEscrowCheckoutModal(
      project.id,
      project.title,
      project.hostName,
      project.trustTemperature
    );
  });
}

async function checkLoginStatus() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return;
    const data = await res.json();
    
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    if (data.loggedIn && data.user) {
      const user = data.user;
      window.currentUser = user;
      if (window.FavoriteStore) await window.FavoriteStore.load();
      
      // Render logged in state
      headerActions.innerHTML = `
        <button type="button" class="btn btn-ghost" id="create-project-btn">프로젝트 올리기</button>
        <div class="user-profile-menu">
          <button type="button" class="user-profile-btn" id="user-menu-btn" aria-haspopup="true" aria-expanded="false">
            <span class="user-avatar" id="user-avatar-span">
              ${user.avatar ? `<img src="${user.avatar}" alt="${user.name}">` : getInitialLetter(user.name)}
            </span>
            <span class="user-name" id="user-name-span">${user.name}</span>
            <span class="dropdown-arrow">▼</span>
          </button>
          <div class="user-dropdown" id="user-dropdown-menu">
            <div class="user-dropdown-header">
              <p class="dropdown-user-name" id="dropdown-user-name">${user.name}</p>
              <p class="dropdown-user-email" id="dropdown-user-email">${user.email}</p>
            </div>
            <hr class="dropdown-divider">
            <a href="${mypageHref()}" class="dropdown-item" style="display:block;color:var(--color-text);font-weight:600;">마이페이지</a>
            ${user.role === 'admin' ? `
              <button type="button" class="dropdown-item" id="admin-mode-toggle">${user.adminMode ? '🛡️ 관리자 모드 끄기' : '🛡️ 관리자 모드 켜기'}</button>
              <a href="${window.DuckrowdRoutes ? DuckrowdRoutes.adminUrl() : '/admin'}" class="dropdown-item" style="display:block;">관리자 심사 콘솔</a>
            ` : ''}
            <hr class="dropdown-divider">
            <button type="button" class="dropdown-item" id="logout-btn">로그아웃</button>
          </div>
        </div>
      `;

      // Hook up Project Wizard
      document.getElementById('create-project-btn').addEventListener('click', (e) => {
        e.preventDefault();
        injectProjectWizardModal();
      });

      const adminModeBtn = document.getElementById('admin-mode-toggle');
      if (adminModeBtn) {
        adminModeBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          const enable = !user.adminMode;
          const res = await fetch('/api/admin/mode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: enable })
          });
          const result = await handleApiResponse(res);
          if (!result.ok) return;
          showToast(enable ? '관리자 모드가 켜졌습니다.' : '일반 사용자 모드로 전환했습니다.', 'success');
          window.location.reload();
        });
      }

      // Dropdown menu toggle
      const menuBtn = document.getElementById('user-menu-btn');
      const dropdownMenu = document.getElementById('user-dropdown-menu');

      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isShown = dropdownMenu.classList.contains('show');
        dropdownMenu.classList.toggle('show', !isShown);
        menuBtn.setAttribute('aria-expanded', !isShown);
      });

      document.addEventListener('click', () => {
        dropdownMenu.classList.remove('show');
        menuBtn.setAttribute('aria-expanded', 'false');
      });

      // Logout handler
      document.getElementById('logout-btn').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          const logoutRes = await fetch('/api/auth/logout', { method: 'POST' });
          if (logoutRes.ok) {
            window.location.reload();
          }
        } catch (err) {
          console.error(err);
        }
      });

      // Detail page sponsor CTA — backer only (host/admin CTAs rendered by detail.js)
      const ctx = window.detailContext;
      if (ctx && ctx.viewerRole === 'backer' && !ctx.myDonation) {
        setupDetailSponsorButton(ctx.project);
      }

    } else {
      // Logged out
      window.currentUser = null;
      if (window.FavoriteStore) {
        window.FavoriteStore.ids = new Set();
        window.FavoriteStore.loaded = true;
      }
      headerActions.innerHTML = `
        <button type="button" class="btn btn-ghost" id="create-project-btn">프로젝트 올리기</button>
        <button type="button" class="btn btn-primary" id="login-nav-btn">로그인/회원가입</button>
      `;

      document.getElementById('create-project-btn').addEventListener('click', (e) => {
        e.preventDefault();
        showToast('프로젝트를 등록하려면 로그인이 필요합니다.', 'warning');
        showLoginModal();
      });

      const loginBtn = document.getElementById('login-nav-btn');
      loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginModal();
      });

      const ctx = window.detailContext;
      const sponsorBtn = document.getElementById('detail-sponsor-btn');
      if (sponsorBtn && ctx && ctx.viewerRole !== 'host' && ctx.viewerRole !== 'admin') {
        sponsorBtn.textContent = '로그인하고 후원하기';
        sponsorBtn.addEventListener('click', (e) => {
          e.preventDefault();
          showLoginModal();
        });
      } else {
        const legacyCta = document.querySelector('.detail-cta .btn-primary');
        if (legacyCta && !legacyCta.id) {
          legacyCta.textContent = '로그인하고 후원하기';
          legacyCta.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginModal();
          });
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}

function showOAuthErrorFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');
  const msg = params.get('msg');
  if (!error) return;

  const messages = {
    google_auth_failed: 'Google 로그인에 실패했습니다.',
    google_auth_start_failed: 'Google 로그인을 시작하지 못했습니다.',
    kakao_auth_failed: 'Kakao 로그인에 실패했습니다.',
    kakao_auth_start_failed: 'Kakao 로그인을 시작하지 못했습니다.'
  };

  showToast(
    `${messages[error] || '로그인 중 오류가 발생했습니다.'}${msg ? ` — ${decodeURIComponent(msg)}` : ''}`,
    'error',
    6000
  );

  params.delete('error');
  params.delete('msg');
  const nextQuery = params.toString();
  const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;
  window.history.replaceState({}, '', nextUrl);
}

document.addEventListener('DOMContentLoaded', () => {
  injectLoginModal();
  showOAuthErrorFromQuery();
  checkLoginStatus();

  const params = new URLSearchParams(window.location.search);
  if (params.get('login') === '1') {
    showLoginModal();
    params.delete('login');
    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;
    window.history.replaceState({}, '', nextUrl);
  }
});
