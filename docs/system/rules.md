# System Rules for Antigravity Developer Agent (LLM OS Kernel Rules)

이 규칙은 Duckrowd 개발을 위임받은 에이전트(LLM OS CPU)가 코드 변경 시 자동으로 로드하고 엄격하게 준수해야 하는 실제 환경 행동 지침입니다.

이 규칙의 구동용 원본 사양은 프로젝트 루트의 [.antigravity/rules.md](file:///c:/Workspace/KpopFandom_CrowdFunding/.antigravity/rules.md)에 실체화되어 자동 바인딩되고 있습니다.

---

## 🎨 1. 프론트엔드 스타일 및 디자인 규칙
- **CSS 프레임워크 배제**: TailwindCSS 등을 일체 배제하고 순수 Vanilla CSS(`public/style.css`)만을 사용해 프론트엔드를 고도화한다.
- **HSL 기반 테마 시스템**: Hex/RGB 컬러 코드를 배제하고 `:root`에 정의된 HSL 변수를 사용하여 디자인의 일관성을 확보한다.
- **Glassmorphism 질감**: 투명 배경과 `backdrop-filter: blur(...)`를 혼합해 입체적인 느낌을 부여한다.
- **마이크로 애니메이션**: 호버 및 액티브 시 부드러운 스케일 조정 및 transition을 바인딩한다.

## 🔒 2. 데이터베이스 및 보안 규칙
- **SQLite 안정성**: pre-compiled statement 파라미터 바인딩을 적용하여 SQL Injection 취약점을 원천 방어한다.
- **트랜잭션(Transaction) 관리**: 후원 결제 및 환불 시 데이터 무결성을 유지하기 위해 `db.transaction()` 내에서 순차 트랜잭션을 적용한다.
- **OAuth 검증**: OAuth callback 처리 시 `state` 난수 값의 세션 정합성을 매 단계 일관되게 검증한다.

## 🚨 3. API 및 예외 처리 가이드라인
- **에러 핸들링**:
  - `401 Unauthorized`: 로그인 유도 모달 자동 노출.
  - `403 Forbidden`: 권한 부족 안내 토스트(Toast) 호출.
  - `500 Internal Error`: 에러 전용 레이아웃(`public/error.html`) 렌더링.
- **에러 포맷**: 에러 응답은 반드시 JSON `{ success: false, error: { code, message } }` 규격을 엄수해야 한다.
