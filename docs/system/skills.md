# Agent Skills Directory (LLM OS Extensible Skills)

이 문서는 Antigravity 에이전트가 Duckrowd 코드를 읽고 분석할 때 실제로 탑재하여 실행하는 커스텀 스킬셋(Skills) 디렉토리 설명서입니다. 

실제 스킬의 정의 및 스키마 코드는 프로젝트 루트의 [.antigravity/skills/](file:///c:/Workspace/KpopFandom_CrowdFunding/.antigravity/skills/) 하위 폴더에 배포되어 작동합니다.

---

## 1. css-linter (Aesthetic CSS 린터)
*바닐라 CSS 디자인 토큰 준수 여부 스캔 스킬*
- **스키마 명세**: [.antigravity/skills/css-linter.json](file:///c:/Workspace/KpopFandom_CrowdFunding/.antigravity/skills/css-linter.json)
- **동작 엔진**: [.antigravity/skills/css-linter.js](file:///c:/Workspace/KpopFandom_CrowdFunding/.antigravity/skills/css-linter.js)
- **주요 검사**: Hex/RGB 컬러 검출 및 HSL 변수 치환 권장 경고 제공, Glassmorphism `backdrop-filter` 유무 스캔.

## 2. db-checker (DB 스키마 검증기)
*데이터베이스 WAL 모드 및 스키마 검증 도구*
- **스키마 명세**: [.antigravity/skills/db-checker.json](file:///c:/Workspace/KpopFandom_CrowdFunding/.antigravity/skills/db-checker.json)
- **동작 엔진**: [.antigravity/skills/db-checker.js](file:///c:/Workspace/KpopFandom_CrowdFunding/.antigravity/skills/db-checker.js)
- **주요 검사**: DB의 WAL 저널링 모드 설정 여부 감지, `users` 및 `projects` 등 필수 테이블 구조 생성 정합성 체크.

## 3. env-guard (로컬 환경 가드)
*서버 포트 충돌 및 OAuth 설정 환경변수 검사 도구*
- **스키마 명세**: [.antigravity/skills/env-guard.json](file:///c:/Workspace/KpopFandom_CrowdFunding/.antigravity/skills/env-guard.json)
- **동작 엔진**: [.antigravity/skills/env-guard.js](file:///c:/Workspace/KpopFandom_CrowdFunding/.antigravity/skills/env-guard.js)
- **주요 검사**: 기본 3000번 포트 점유 여부 감지, `.env` 내 Google/Kakao Client ID 필수 자격증명 파싱 검사.
