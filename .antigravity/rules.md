# Antigravity Agent Coding & Behavioral Rules

이 규칙은 Antigravity 에이전트(즉, 저 자신)가 Duckrowd 코드를 개발, 리팩토링, 디버깅할 때 준수해야 하는 강제적인 지침(Active Guidelines)입니다. 

이 파일을 프로젝트 루트에 배포함으로써, 이 워크스페이스 상에서 수행되는 모든 에이전트 연산의 정합성과 품질을 시스템적으로 규제합니다.

---

## 🎨 1. Aesthetic Design Rules (디자인 시스템 제약)
- **Vanilla CSS 테마 지향**: TailwindCSS 등 어떠한 CSS 프레임워크도 사용하지 말고, 순수 Vanilla CSS(`public/style.css`)로 통제하십시오.
- **Hex/RGB 컬러 하드코딩 전면 지양**:
  - CSS에 직접 `#ffffff`, `rgba(0,0,0,1)` 등을 기입하지 마십시오.
  - 모든 색상은 `:root`에 정의된 HSL 테마 변수(예: `var(--color-primary)`, `var(--color-bg-deep)`)를 거쳐서 사용하도록 강제됩니다.
- **Glassmorphism 질감**:
  - 프리미엄 카드 UI 제작 시, 투명 배경(`rgba(..., 0.45)` 등)과 뒷배경 블러(`backdrop-filter: blur(...)`)를 조합하여 입체적인 유리 효과를 필히 적용해야 합니다.
- **마이크로 모션**:
  - 모든 클릭 가능 요소(`button`, `a`, `card` 등)에는 반드시 호버/액티브 시의 `transition` 속성과 미세 스케일 조정(`transform: scale(...)`)을 바인딩하십시오.

## 🔒 2. Security & SQL Integrity (보안 및 트랜잭션)
- **SQLite PreparedStatement 바인딩**:
  - 쿼리에 사용자 입력을 보간문(`$variable` 등)으로 직접 넣지 말고, 반드시 파라미터 쿼리(`db.prepare('... = ?')`)를 활용하여 SQL Injection을 방어하십시오.
- **트랜잭션(Transaction) 강제**:
  - 후원 결제(`POST /api/projects/:id/sponsor`) 및 환불(`POST /api/donations/:id/refund`) 등 다중 테이블 쓰기가 연동되는 로직은 무조건 `db.transaction()` 블록으로 래핑하여 데이터의 영속성 원자성을 보장하십시오.
- **OAuth State 및 PKCE 검증**:
  - 인증 콜백 라우트 구현 시, 세션에 담긴 `state` 난수 값과 브라우저 인가 값 간의 정합성을 매번 1순위로 엄수하여 검사하십시오.

## 🚨 3. Global Exception Handling (예외 처리 규격)
- **API Response**: 모든 에러 응답은 일관된 JSON 객체 `{ success: false, error: { code, message } }` 구조로 반환하십시오.
- **401/403/500 UI 대응**:
  - `401 Unauthorized`: API 응답 검사 후 로그인 유도 모달을 즉시 트리거하십시오.
  - `403 Forbidden`: 권한 부족 안내 토스트(Toast)를 호출하십시오.
  - `500 Server Error`: 사용자 화면이 멈추지 않도록 에러 전용 레이아웃(`public/error.html`)으로 이동시키거나, 모달로 에러 트레이스를 가려 안전하게 노출하십시오.
