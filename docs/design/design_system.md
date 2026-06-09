# Design System & Aesthetic Token Specifications

이 문서는 Duckrowd 플랫폼이 추구하는 세련되고 몰입감 있는 팬덤 크라우드펀딩 사용자 경험을 구축하기 위한 심미적 디자인 시스템 사양서입니다. 본 명세는 순수 Vanilla CSS 환경에서 구현되도록 철저히 설계되었습니다.

---

## 1. Typography (타이포그래피)
- **Primary Web Font**: [Outfit](https://fonts.google.com/specimen/Outfit) (글로벌 펀딩 지표, 숫자 표현)
- **Secondary Sans-serif Font**: [Inter](https://fonts.google.com/specimen/Inter) or `Pretendard` (일반 텍스트, 아티클 본문)
- **Scale Guide**:
  ```css
  --font-size-xs: 0.75rem;   /* 12px: 태그, 배지 */
  --font-size-sm: 0.875rem;  /* 14px: 서브 텍스트, 메타데이터 */
  --font-size-base: 1rem;    /* 16px: 본문 */
  --font-size-md: 1.125rem;  /* 18px: 서브 헤더, 인풋 필드 */
  --font-size-lg: 1.5rem;    /* 24px: 카드 제목, 카드 섹션 타이틀 */
  --font-size-xl: 2.25rem;   /* 36px: 히어로 배너 타이틀, 메인 강조 지표 */
  ```

---

## 2. Harmonious HSL Color Palette (컬러 시스템)

하드코딩된 Hex 값 대신 명도와 채도를 자유롭게 제어할 수 있는 HSL 변수를 사용하여 모던한 대비와 다크/라이트 테마를 구현합니다.

### 🎨 Dark Mode Theme (Default / Premium Midnight)
```css
:root {
  /* Brand Primary */
  --color-primary-h: 328;
  --color-primary-s: 100%;
  --color-primary-l: 59%;    /* Neon K-pop Pink (#FF2E93) */
  --color-primary: hsl(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l));
  
  /* Brand Secondary */
  --color-secondary-h: 247;
  --color-secondary-s: 95%;
  --color-secondary-l: 65%;  /* Electric Indigo (#6344FF) */
  --color-secondary: hsl(var(--color-secondary-h), var(--color-secondary-s), var(--color-secondary-l));

  /* UI Backgrounds */
  --color-bg-deep: hsl(230, 25%, 8%);      /* 깊은 우주색 (#0D0E15) */
  --color-bg-card: rgba(26, 28, 45, 0.45);   /* 반투명 카드 백그라운드 */
  --color-bg-glass: rgba(13, 14, 21, 0.7);   /* 블러용 글래스 효과 */
  
  /* UI Borders */
  --color-border-glass: rgba(255, 255, 255, 0.08);
  --color-border-focus: rgba(99, 68, 255, 0.4);

  /* Status Colors */
  --color-success: hsl(145, 80%, 45%);
  --color-warning: hsl(45, 100%, 50%);
  --color-error: hsl(0, 85%, 60%);
}
```

---

## 3. Glassmorphism & Card Style Specs

프리미엄한 질감을 표현하기 위해 카드의 배경 블러(Backdrop blur)와 미세한 내부 그림자를 활용하여 화면 요소들이 붕 떠 있는 공간감을 부여합니다.

```css
.premium-glass-card {
  background: var(--color-bg-card);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid var(--color-border-glass);
  border-radius: 20px;
  box-shadow: 
    0 8px 32px 0 rgba(0, 0, 0, 0.37),
    inset 0 1px 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.premium-glass-card:hover {
  transform: translateY(-6px);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 12px 40px 0 rgba(0, 0, 0, 0.5),
    inset 0 1px 2px 0 rgba(255, 255, 255, 0.1);
  background: rgba(26, 28, 45, 0.6);
}
```

---

## 4. Micro-animations & Interactive Effects

체감 UX를 프리미엄하게 끌어올리는 호버 효과와 버튼 클릭 액션을 정의합니다.

### ① Shimmer Loading Effect (스케일 스켈레톤 애니메이션)
데이터가 로드되지 않았을 때 반투명한 흰색 빛이 빗겨 나가는 스켈레톤 애니메이션입니다.
```css
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-loading {
  background: linear-gradient(90deg, #1b1d30 25%, #2a2e4b 50%, #1b1d30 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}
```

### ② Magnetic Hover Buttons (자석 같은 흡입 효과)
```css
.interactive-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: #fff;
  border: none;
  padding: 12px 24px;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, filter 0.2s ease;
}

.interactive-btn:hover {
  transform: scale(1.03);
  filter: brightness(1.1) drop-shadow(0 0 10px rgba(255, 46, 147, 0.5));
}

.interactive-btn:active {
  transform: scale(0.97);
}
```
