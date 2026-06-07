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
      <div class="modal-box modal-box--wide" style="position:relative;">
        <div class="escrow-loading-overlay" id="checkout-loading">
          <div class="escrow-spinner" id="checkout-spinner"></div>
          <div class="escrow-success-icon" id="checkout-success-icon" style="display:none;">✓</div>
          <p class="escrow-loading-text" id="checkout-loading-text">에스크로 결제 처리 중...</p>
        </div>
        
        <button type="button" class="modal-close-btn" id="checkout-modal-close">&times;</button>
        <div class="modal-logo" style="font-size:1.5rem;margin-bottom:4px;">Duckrowd Escrow</div>
        <p class="modal-title" style="margin-bottom:16px;">안전 에스크로 후원 결제</p>
        
        <div style="width:100%;background:var(--color-surface);padding:12px 16px;border-radius:var(--radius-sm);margin-bottom:16px;font-size:0.85rem;">
          <p style="font-weight:700;color:var(--color-text);margin-bottom:4px;">${projectTitle}</p>
          <p style="color:var(--color-text-muted);">총대: ${hostName} (🌡️ 덕질 온도 ${trustTemp}도)</p>
        </div>

        <form id="checkout-form" style="width:100%;">
          <div class="form-group">
            <label class="form-label">후원 금액 설정</label>
            <div class="escrow-amount-selector">
              <button type="button" class="escrow-amount-btn" data-val="10000">1만 원</button>
              <button type="button" class="escrow-amount-btn active" data-val="30000">3만 원</button>
              <button type="button" class="escrow-amount-btn" data-val="50000">5만 원</button>
            </div>
            <div class="escrow-custom-amount">
              <input type="number" id="checkout-amount" class="form-input" required value="30000" min="1000" step="1000" placeholder="직접 금액 입력">
            </div>
          </div>

          <div class="escrow-notice-box">
            <span class="escrow-notice-icon">🛡️</span>
            <div class="escrow-notice-text">
              <strong>덕라우드 에스크로 약정</strong>: 본 후원금은 펀딩 성공 시까지 덕라우드 안전 계좌에 보관되며, <strong>목표 금액 미달성 혹은 취소 시 100% 전액 환불</strong>됩니다. 펀딩 성공 후에도 총대에게 한 번에 정산되지 않고 <strong>제작/예약 단계에 맞추어 분할 정산</strong>됩니다.
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">결제 수단 선택</label>
            <div class="payment-method-grid">
              <div class="payment-card active" data-method="신용카드">
                <span class="payment-card-icon">💳</span>
                <span>신용카드</span>
              </div>
              <div class="payment-card" data-method="간편계좌이체">
                <span class="payment-card-icon">🏦</span>
                <span>계좌이체</span>
              </div>
              <div class="payment-card" data-method="카카오페이">
                <span class="payment-card-icon">💛</span>
                <span>카카오페이</span>
              </div>
              <div class="payment-card" data-method="토스페이">
                <span class="payment-card-icon">💙</span>
                <span>토스페이</span>
              </div>
            </div>
          </div>

          <div class="payment-terms">
            <label class="term-checkbox-label">
              <input type="checkbox" id="term-agree-1" required checked>
              <span>위의 안전 에스크로 펀딩 거래 및 환불 정책 동의 (필수)</span>
            </label>
            <label class="term-checkbox-label">
              <input type="checkbox" id="term-agree-2" required checked>
              <span>개인정보 제3자(총대/이벤트 대행업체) 제공 동의 (필수)</span>
            </label>
          </div>

          <button type="submit" class="btn btn-primary" style="width:100%;padding:14px;font-size:1rem;">에스크로 후원 결제하기</button>
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
  const paymentCards = document.querySelectorAll('.payment-card');

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
  paymentCards.forEach(card => {
    card.addEventListener('click', () => {
      paymentCards.forEach(c => c.classList.remove('active'));
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
    loadingText.textContent = '에스크로 안전 결제 검증 중...';

    try {
      // Send to server
      const res = await fetch(`/api/projects/${projectId}/sponsor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: finalAmount, paymentMethod: selectedMethod })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '결제 처리에 실패했습니다.');
      }

      const data = await res.json();

      // Show success animation
      setTimeout(() => {
        spinner.style.display = 'none';
        successIcon.style.display = 'block';
        loadingText.textContent = `${formatCurrency(finalAmount)} 에스크로 예치 완료!`;
        
        setTimeout(() => {
          closeModal();
          // Reload page to reflect new amounts
          window.location.reload();
        }, 1500);
      }, 1200);

    } catch (err) {
      alert(err.message);
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
      <div class="modal-box modal-box--wide" style="position:relative;">
        <div class="escrow-loading-overlay" id="wizard-loading">
          <div class="escrow-spinner" id="wizard-spinner"></div>
          <div class="escrow-success-icon" id="wizard-success-icon" style="display:none;">✓</div>
          <p class="escrow-loading-text" id="wizard-loading-text">신청서 심사 요청 중...</p>
        </div>

        <button type="button" class="modal-close-btn" id="wizard-modal-close">&times;</button>
        <div class="modal-logo" style="font-size:1.5rem;margin-bottom:4px;">Duckrowd Studio</div>
        <p class="modal-title" style="margin-bottom:20px;">새 프로젝트 개설 신청</p>

        <!-- Step Indicator -->
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
            <span class="step-label">에스크로 약정</span>
          </div>
        </div>

        <form id="wizard-form" style="width:100%;">
          <!-- Step 1 Panel -->
          <div class="wizard-panel active" id="panel-1">
            <div class="form-group">
              <label for="wiz-title" class="form-label">프로젝트 제목</label>
              <input type="text" id="wiz-title" class="form-input" required placeholder="예: 홍대입구역 2호선 생일 광고 전광판 이벤트">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label for="wiz-category" class="form-label">카테고리</label>
                <select id="wiz-category" class="form-input" style="background-color: var(--color-bg);" required>
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
              <label for="wiz-story" class="form-label">프로젝트 스토리 (상세 설명)</label>
              <textarea id="wiz-story" class="form-input" style="height:100px;resize:none;" required placeholder="후원자들에게 프로젝트 취지와 상세 일정을 공유해보세요."></textarea>
            </div>
          </div>

          <!-- Step 2 Panel -->
          <div class="wizard-panel" id="panel-2">
            <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:12px;">
              <div class="form-group">
                <label for="wiz-goal" class="form-label">목표 금액</label>
                <div class="escrow-custom-amount" style="margin-bottom:0;">
                  <input type="number" id="wiz-goal" class="form-input" required min="10000" step="10000" value="5000000" placeholder="예: 5000000">
                </div>
              </div>
              <div class="form-group">
                <label for="wiz-days" class="form-label">펀딩 기간 (일)</label>
                <input type="number" id="wiz-days" class="form-input" required min="1" max="90" value="30" placeholder="30">
              </div>
            </div>
            <div class="form-group" style="margin-top:12px;">
              <label for="wiz-escrow-plan" class="form-label">에스크로 예산 정산 계획 (단계별 예산안)</label>
              <textarea id="wiz-escrow-plan" class="form-input" style="height:140px;resize:none;" required placeholder="예:&#10;- 1단계 (선금 40%): 전광판 미디어 에이전시 예약 계약금 지급&#10;- 2단계 (잔금 60%): 광고 심의 완료 및 게재 당일 잔금 정산 수령"></textarea>
              <p style="font-size:0.7rem;color:var(--color-text-muted);margin-top:4px;line-height:1.3;">※ 구체적이고 실현 가능한 정산 조건이어야 안전 에스크로 심사를 통과할 수 있습니다.</p>
            </div>
          </div>

          <!-- Step 3 Panel -->
          <div class="wizard-panel" id="panel-3">
            <div class="escrow-notice-box" style="margin-bottom:16px;">
              <span class="escrow-notice-icon">🛡️</span>
              <div class="escrow-notice-text">
                <strong>덕라우드 에스크로 서비스 이용 규칙</strong>
                <br>1. <strong>100% 자동 환불 약정</strong>: 목표 금액 미달성 시 모든 후원금은 자동 승인 취소 및 환불됩니다.
                <br>2. <strong>단계별 분할 정산</strong>: 제출한 정산 계획안에 따라 영수증 및 증빙 자료 제출 확인 후 분할 송금됩니다.
                <br>3. <strong>투명 정산 및 대행</strong>: 예산 유용이나 횡령 의혹 발생 시 플랫폼의 소명 요구가 동반되며, 미소명 시 에스크로 예치금 지급이 정지됩니다.
              </div>
            </div>
            <div class="payment-terms" style="margin-top:20px;">
              <label class="term-checkbox-label">
                <input type="checkbox" id="wiz-agree-1" required checked>
                <span>에스크로 심사 기준 및 단계별 정산 규칙을 확인하였으며 이에 동의합니다. (필수)</span>
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

          <!-- Footer Buttons -->
          <div class="wizard-footer">
            <button type="button" class="btn btn-ghost" id="wiz-prev" style="display:none;border:1px solid var(--color-border);">이전</button>
            <button type="button" class="btn btn-primary" id="wiz-next" style="margin-left:auto;">다음</button>
            <button type="submit" class="btn btn-primary" id="wiz-submit" style="display:none;margin-left:auto;">에스크로 심사 신청</button>
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

    // Buttons visibility
    if (currentStep === 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'block';
      nextBtn.style.marginLeft = 'auto';
      submitBtn.style.display = 'none';
    } else if (currentStep === 2) {
      prevBtn.style.display = 'block';
      nextBtn.style.display = 'block';
      nextBtn.style.marginLeft = '0';
      submitBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'block';
      nextBtn.style.display = 'none';
      submitBtn.style.display = 'block';
    }
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
          gradient: selectedGradient
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '프로젝트 등록에 실패했습니다.');
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
      alert(err.message);
      loadingOverlay.classList.remove('show');
    }
  });
}


// ----------------------------------------------------
// 4. MY ESCROW HISTORY DASHBOARD (MY PAGE)
// ----------------------------------------------------
async function showEscrowDashboard() {
  const existing = document.getElementById('escrow-dashboard-overlay');
  if (existing) existing.remove();

  // Create loading placeholder modal
  const dashboardHtml = `
    <div class="modal-overlay" id="escrow-dashboard-overlay">
      <div class="modal-box modal-box--extrawide" style="position:relative;min-height:400px;display:flex;flex-direction:column;align-items:stretch;">
        <div class="escrow-loading-overlay show" id="dashboard-loading">
          <div class="escrow-spinner" id="dashboard-spinner"></div>
          <p class="escrow-loading-text" id="dashboard-loading-text">에스크로 정산 내역 로딩 중...</p>
        </div>

        <button type="button" class="modal-close-btn" id="dashboard-modal-close">&times;</button>
        <div class="modal-logo" style="font-size:1.5rem;margin-bottom:4px;text-align:center;">My Page</div>
        <p class="modal-title" style="margin-bottom:20px;text-align:center;">에스크로 정산 & 마이페이지</p>

        <!-- Stats row -->
        <div class="escrow-stats">
          <div class="stat-card">
            <p class="stat-label">총 후원 예치금</p>
            <p class="stat-value primary" id="stat-total-sponsored">₩0</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">안전 에스크로 보관액</p>
            <p class="stat-value" id="stat-escrow-holding" style="color:#f97316;">₩0</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">총 환불 완료액</p>
            <p class="stat-value" id="stat-total-refunded" style="color:#ef4444;">₩0</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="escrow-tabs">
          <button type="button" class="escrow-tab-btn active" id="tab-btn-donations">내가 참여한 후원</button>
          <button type="button" class="escrow-tab-btn" id="tab-btn-hosted">개설 신청한 프로젝트</button>
        </div>

        <!-- Lists -->
        <div id="donations-list-container" class="escrow-list">
          <!-- User donations loaded here -->
        </div>

        <div id="hosted-list-container" class="escrow-list" style="display:none;">
          <!-- Created projects loaded here -->
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', dashboardHtml);

  const overlay = document.getElementById('escrow-dashboard-overlay');
  const closeBtn = document.getElementById('dashboard-modal-close');
  const loader = document.getElementById('dashboard-loading');

  // Tab buttons
  const tabDonations = document.getElementById('tab-btn-donations');
  const tabHosted = document.getElementById('tab-btn-hosted');
  const containerDonations = document.getElementById('donations-list-container');
  const containerHosted = document.getElementById('hosted-list-container');

  tabDonations.addEventListener('click', () => {
    tabDonations.classList.add('active');
    tabHosted.classList.remove('active');
    containerDonations.style.display = 'flex';
    containerHosted.style.display = 'none';
  });

  tabHosted.addEventListener('click', () => {
    tabHosted.classList.add('active');
    tabDonations.classList.remove('active');
    containerHosted.style.display = 'flex';
    containerDonations.style.display = 'none';
  });

  // Open modal animation
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

  // Fetch data
  await loadEscrowDashboardData(loader, containerDonations, containerHosted);
}

async function loadEscrowDashboardData(loader, donationsContainer, hostedContainer) {
  try {
    const res = await fetch('/api/users/me/escrow');
    if (!res.ok) throw new Error('에스크로 내역을 가져올 수 없습니다.');
    const data = await res.json();

    // Stats calculations
    let totalSponsored = 0;
    let escrowHolding = 0;
    let totalRefunded = 0;

    // Render Donations
    donationsContainer.innerHTML = '';
    if (!data.donations || data.donations.length === 0) {
      donationsContainer.innerHTML = '<div class="escrow-empty">참여한 에스크로 후원 내역이 없습니다.</div>';
    } else {
      data.donations.forEach(d => {
        if (d.status === 'holding') {
          totalSponsored += d.amount;
          escrowHolding += d.amount;
        } else if (d.status === 'released') {
          totalSponsored += d.amount;
        } else if (d.status === 'refunded') {
          totalRefunded += d.amount;
        }

        const dateStr = new Date(d.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
        
        let badgeClass = 'badge-holding';
        let statusText = '에스크로 보관 중';
        let actionButton = '';

        if (d.status === 'released') {
          badgeClass = 'badge-released';
          statusText = '총대 정산 완료';
        } else if (d.status === 'refunded') {
          badgeClass = 'badge-refunded';
          statusText = '환불 완료';
        } else if (d.status === 'holding') {
          // If project status allows refunding (still funding)
          if (d.projectStatus === '펀딩 진행 중' || d.projectStatus === '심사 중') {
            actionButton = `<button type="button" class="btn-refund" data-donation-id="${d.id}">환불 신청</button>`;
          }
        }

        const itemHtml = `
          <div class="escrow-item-card">
            <div class="escrow-item-thumb" style="background:${d.projectGradient}">${d.projectEmoji}</div>
            <div class="escrow-item-details">
              <p class="escrow-item-title">${d.projectTitle}</p>
              <p class="escrow-item-meta">결제수단: ${d.paymentMethod} · 후원일: ${dateStr}</p>
            </div>
            <div class="escrow-item-actions">
              <span class="escrow-item-amount">${formatCurrency(d.amount)}</span>
              <span class="badge ${badgeClass}">${statusText}</span>
              ${actionButton}
            </div>
          </div>
        `;
        donationsContainer.insertAdjacentHTML('beforeend', itemHtml);
      });

      // Bind refund click handlers
      donationsContainer.querySelectorAll('.btn-refund').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const donationId = btn.dataset.donationId;
          
          if (!confirm('정말 이 후원을 취소하고 에스크로 예치금을 환불 신청하시겠습니까?')) return;

          loader.classList.add('show');
          loader.querySelector('.escrow-loading-text').textContent = '에스크로 즉시 환불 처리 중...';

          try {
            const refundRes = await fetch(`/api/donations/${donationId}/refund`, { method: 'POST' });
            if (!refundRes.ok) {
              const err = await refundRes.json();
              throw new Error(err.error || '환불 처리에 실패했습니다.');
            }
            
            // Reload dashboard data
            await loadEscrowDashboardData(loader, donationsContainer, hostedContainer);
          } catch (refundErr) {
            alert(refundErr.message);
            loader.classList.remove('show');
          }
        });
      });
    }

    // Render Hosted Projects
    hostedContainer.innerHTML = '';
    if (!data.createdProjects || data.createdProjects.length === 0) {
      hostedContainer.innerHTML = '<div class="escrow-empty">개설 신청한 프로젝트가 없습니다.</div>';
    } else {
      data.createdProjects.forEach(p => {
        let statusBadgeClass = 'badge-funding';
        if (p.status === '심사 중') statusBadgeClass = 'badge-review';
        if (p.status.includes('무산') || p.status.includes('환불')) statusBadgeClass = 'badge-refunded';

        const itemHtml = `
          <div class="escrow-item-card">
            <div class="escrow-item-thumb" style="background:${p.gradient}">${p.emoji}</div>
            <div class="escrow-item-details">
              <p class="escrow-item-title">${p.title}</p>
              <p class="escrow-item-meta">카테고리: ${p.category} · 달성률: ${p.percentFunded}%</p>
            </div>
            <div class="escrow-item-actions">
              <span class="escrow-item-amount">${formatCurrency(p.currentAmount)}</span>
              <span class="badge ${statusBadgeClass}">${p.status}</span>
            </div>
          </div>
        `;
        hostedContainer.insertAdjacentHTML('beforeend', itemHtml);
      });
    }

    // Update Stats Display
    document.getElementById('stat-total-sponsored').textContent = formatCurrency(totalSponsored);
    document.getElementById('stat-escrow-holding').textContent = formatCurrency(escrowHolding);
    document.getElementById('stat-total-refunded').textContent = formatCurrency(totalRefunded);

    loader.classList.remove('show');

  } catch (err) {
    alert(err.message);
    loader.classList.remove('show');
  }
}


// ----------------------------------------------------
// 5. SESSION & HEADER STATE SYNC
// ----------------------------------------------------
async function checkLoginStatus() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return;
    const data = await res.json();
    
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    if (data.loggedIn && data.user) {
      const user = data.user;
      
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
            <button type="button" class="dropdown-item" id="my-escrow-btn" style="color:var(--color-text);font-weight:600;">에스크로 내역</button>
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

      // Hook up Escrow Dashboard My Page
      document.getElementById('my-escrow-btn').addEventListener('click', (e) => {
        e.preventDefault();
        showEscrowDashboard();
      });

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

      // Detail page CTA Escrow checkout override
      const ctaBtn = document.querySelector('.detail-cta .btn-primary');
      if (ctaBtn) {
        ctaBtn.textContent = '이 프로젝트 후원하기 (Escrow)';
        ctaBtn.removeAttribute('data-demo');
        
        // Grab current project details dynamically from UI page elements
        const titleEl = document.querySelector('.detail-title');
        const projectTitle = titleEl ? titleEl.textContent : '프로젝트 후원';
        const hostEl = document.querySelector('.host-name');
        const hostName = hostEl ? hostEl.textContent.replace('총대', '').trim() : '총대';
        
        // Find project ID from URL
        const params = new URLSearchParams(window.location.search);
        const projectId = parseInt(params.get('id'), 10);

        ctaBtn.addEventListener('click', (e) => {
          e.preventDefault();
          injectEscrowCheckoutModal(projectId, projectTitle, hostName, 99);
        });
      }

    } else {
      // Logged out
      headerActions.innerHTML = `
        <button type="button" class="btn btn-ghost" id="create-project-btn">프로젝트 올리기</button>
        <button type="button" class="btn btn-primary" id="login-nav-btn">로그인/회원가입</button>
      `;

      document.getElementById('create-project-btn').addEventListener('click', (e) => {
        e.preventDefault();
        alert('프로젝트를 등록하려면 로그인이 필요합니다.');
        showLoginModal();
      });

      const loginBtn = document.getElementById('login-nav-btn');
      loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginModal();
      });

      const ctaBtn = document.querySelector('.detail-cta .btn-primary');
      if (ctaBtn) {
        ctaBtn.textContent = '로그인하고 에스크로 후원하기';
        ctaBtn.removeAttribute('data-demo');
        ctaBtn.addEventListener('click', (e) => {
          e.preventDefault();
          showLoginModal();
        });
      }
    }
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  injectLoginModal();
  checkLoginStatus();
});
