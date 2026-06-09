# Duckrowd

K-POP 팬 주최 이벤트 C2C 크라우드펀딩 **데모** 웹 애플리케이션입니다.  
Express 서버가 정적 페이지와 샘플 API를 제공하며, Google·Kakao **실제 OAuth** 로그인과 후원 결제·프로젝트 등록을 **SQLite**에 저장합니다. 서버 재시작 후에도 CRUD 결과가 유지됩니다.

## 사전 요구 사항

- [Node.js](https://nodejs.org/) 18 이상 (LTS 권장)
- npm (Node.js 설치 시 함께 제공)

설치 여부 확인:

```bash
node -v
npm -v
```

## 설치 및 실행

### 1. 저장소(프로젝트 폴더)로 이동

```bash
cd c:\workspace\Fanding
```

경로는 본인 환경에 맞게 수정하세요.

### 2. 의존성 설치

처음 한 번만 실행합니다.

```bash
npm install
```

### 3. OAuth 설정 (소셜 로그인)

`.env.example`을 복사해 `.env`를 만들고 Google/Kakao 자격 증명을 입력합니다.

```bash
copy .env.example .env   # Windows
# cp .env.example .env   # macOS / Linux
```

| 변수 | 설명 |
|------|------|
| `REDIRECT_URI_BASE` | 브라우저 접속 URL과 **완전히 동일**해야 함 (예: `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console OAuth 2.0 클라이언트 |
| `KAKAO_CLIENT_ID` | Kakao Developers **REST API 키** (JavaScript 키 아님) |
| `KAKAO_CLIENT_SECRET` | Kakao Client Secret 사용 시에만 설정 |
| `ADMIN_IDENTIFIERS` | 관리자 식별자 (쉼표 구분). Google 이메일 앞부분·이름·id 매칭 (기본: `dodamm111`) |
| `ADMIN_EMAILS` | (선택) 관리자 OAuth 이메일 전체 주소 |
| `DATABASE_PATH` | (선택) SQLite DB 파일 경로. 기본값 `data/duckrowd.db` |

리다이렉트 URI 등록:
- Google: `{REDIRECT_URI_BASE}/auth/google/callback`
- Kakao: `{REDIRECT_URI_BASE}/auth/kakao/callback`

### 4. 서버 시작

```bash
npm start
```

터미널에 `Duckrowd demo server running at http://localhost:3000` 및 OAuth enabled/not configured 상태가 출력되면 정상입니다.

### 5. 브라우저에서 접속

| 페이지 | URL |
|--------|-----|
| 메인 (프로젝트 목록) | http://localhost:3000 |
| 프로젝트 상세 | http://localhost:3000/detail.html?id=1 |

`id`는 1~10 사이 샘플 프로젝트 ID입니다.

## 포트 변경

기본 포트는 `3000`입니다. 다른 포트를 쓰려면 환경 변수 `PORT`를 지정한 뒤 서버를 실행하세요.

**Windows (PowerShell)**

```powershell
$env:PORT=8080; npm start
```

**macOS / Linux**

```bash
PORT=8080 npm start
```

## API (참고)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/hero-slides` | 메인 히어로 슬라이드 |
| GET | `/api/projects` | 프로젝트 목록 (필터·검색·카테고리) |
| GET | `/api/projects/featured` | 추천 프로젝트 목록 |
| GET | `/api/projects/popular` | 인기 프로젝트 목록 |
| GET | `/api/projects/:id/community/posts/:postId` | 게시글 상세 |
| GET | `/api/projects/:id` | 프로젝트 상세 (예: `/api/projects/1`) |
| POST | `/api/projects` | 프로젝트 등록 (로그인 필수) |
| POST | `/api/projects/:id/sponsor` | 후원 결제 (로그인 필수, 시뮬레이션) |
| GET | `/api/users/me/escrow` | 마이페이지 결제·후원 내역 |
| GET | `/api/users/me/favorites` | 관심 프로젝트 목록 (로그인) |
| GET | `/api/users/me/favorites/ids` | 관심 프로젝트 ID 목록 (로그인) |
| POST | `/api/users/me/favorites/:projectId` | 관심 프로젝트 추가 (로그인) |
| DELETE | `/api/users/me/favorites/:projectId` | 관심 프로젝트 제거 (로그인) |
| POST | `/api/donations/:id/refund` | 후원 환불 |
| GET | `/api/auth/me` | 현재 로그인 사용자 |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/auth/google`, `/auth/kakao` | Google·Kakao OAuth 로그인 (`.env` 필수) |
| GET | `/api/projects/:id/community` | 커뮤니티 전체 (공지·일정·투표·게시판·내 활동) |
| POST | `/api/projects/:id/community/notices` | 공지 등록 (총대·관리자) |
| POST | `/api/projects/:id/community/schedules` | 일정 등록 (총대·관리자) |
| POST | `/api/projects/:id/community/polls` | 투표 생성 (총대·관리자) |
| POST | `/api/projects/:id/community/polls/:pollId/vote` | 투표 참여 (로그인) |
| POST | `/api/projects/:id/community/posts` | 게시글 작성 (로그인) |
| POST | `/api/projects/:id/community/posts/:postId/comments` | 댓글 작성 (로그인) |
| POST | `/api/projects/:id/community/posts/:postId/like` | 게시글 좋아요 토글 |
| POST | `/api/projects/:id/community/comments/:commentId/like` | 댓글 좋아요 토글 |
| DELETE | `/api/projects/:id/community/*` | 공지·일정·투표·게시글·댓글 삭제 |
| GET | `/api/users/me/community` | 내가 쓴 글·댓글 (전체 프로젝트) |
| GET | `/api/admin/projects/pending` | 심사 대기 목록 (관리자) |
| POST | `/api/admin/projects/:id/review` | 심사 승인/거절 + 총대 DM (관리자) |
| GET | `/api/admin/overview` | 관리자 대시보드 (심사 대기 통계) |
| DELETE | `/api/admin/projects/:id` | 프로젝트 삭제 (관리자) |
| POST | `/api/admin/projects/:id/dm` | 총대 DM 발송 (관리자) |
| POST | `/api/admin/mode` | 관리자 모드 on/off 토글 |
| GET | `/api/users/me/host-inbox` | 총대 운영팀 DM 수신함 |

## 프로젝트 구조

```
.
├── lib/
│   ├── oauth.js           # Google(Kakao) OAuth, PKCE·state 검증
│   ├── database.js        # SQLite 영속화 (projects, donations, sessions)
│   └── seed-data.js       # 최초 실행 시 시드 프로젝트 10건
├── data/
│   └── duckrowd.db        # SQLite DB (자동 생성, .gitignore)
├── server.js              # Express 서버, 결제·후원 API
├── package.json
├── .env.example           # OAuth·포트 환경 변수 예시
├── docs/                  # 사업 기획서
├── public/
│   ├── index.html         # 메인 페이지
│   ├── detail.html        # 상세 페이지
│   ├── oauth-setup.html   # OAuth 미설정 안내
│   ├── script.js          # 메인 페이지 스크립트
│   ├── detail.js          # 상세 페이지 스크립트
│   ├── auth.js            # 로그인, 후원, 등록, 마이페이지
│   └── style.css          # 스타일
└── README.md
```

## 개발 현황

### Done (완료)

- **메인 페이지** — 히어로 슬라이드, 추천·인기 프로젝트 목록, 네비 필터·카테고리 숏컷·검색 (`GET /api/projects`), 카드→상세 연결
- **프로젝트 상세** — 펀딩 스토리 / 커뮤니티(공지·일정·투표·게시판) / 환불 정책 탭, 총대 프로필, 모금 현황
- **소셜 로그인** — Google·Kakao **실제 OAuth** (`openid-client` + PKCE·state), `cookie-parser` 세션, `.env` 기반 자격 증명
- **HTTP 에러 UX** — 401·404·500 API 코드 통일, `error.html` 안내 화면, 토스트 알림, 401 시 로그인 모달 자동 유도
- **역할 기반 접근 제어** — `user` / `admin` 역할, `hostUserId` 소유권, 403 거부, 본인 후원·본인 프로젝트만 수정
- **역할별 상세 화면** — 후원자·총대·관리자 뷰 분기 (`detail.js`), 총대 공지 등록 API
- **관리자 심사 콘솔** — `admin.html`, 심사 대기·전체 프로젝트, 승인/거절(DM), 프로젝트 삭제, 총대 DM, `dodamm111` 관리자 모드
- **후원 결제 (시뮬레이션)** — 후원 모달, 금액·결제 수단 UI, `POST /api/projects/:id/sponsor`, 모금액·달성률 실시간 갱신
- **프로젝트 등록** — 3단계 위저드 (기본 정보 → 예산·정산 → 결제·환불 약정), `POST /api/projects`
- **마이페이지** — 결제·후원 내역, 내 후원·개설 프로젝트 목록 (`GET /api/users/me/escrow`)
- **환불** — 보관 중(`holding`) 후원 환불, 프로젝트 모금액 차감 연동 (`POST /api/donations/:id/refund`)
- **샘플 데이터** — 10개 프로젝트, 히어로 슬라이드, 커뮤니티 공지·투표 (읽기 전용)
- **데이터베이스·영속성** — SQLite(`better-sqlite3`) 연동, 프로젝트·후원·세션 DB 저장, 서버 재시작 후 CRUD 결과 유지
- **커뮤니티** — 공지·일정·투표·게시글·댓글·좋아요 CRUD, 내 활동, SQLite 영속화 (`public/community.js`, `lib/communityRoutes.js`)
- **UX·피드백 (경량)** — 메인 목록 카드 스켈레톤 로딩, 토스트·에러 페이지·401 로그인 유도 (`public/errors.js`, `public/error.html`)
- **프로젝트 즐겨찾기** — 로그인 사용자 관심 프로젝트 저장 (`user_favorites`), 카드·상세 ♡ 토글, 마이페이지 「관심 프로젝트」 탭 (`lib/favorites.js`, `public/favorites.js`)

### UX·인증 선별 적용 — 배제 항목 (의도적으로 미구현)

MVP 범위와 docs 정합을 위해 아래는 **도입하지 않습니다**.

| 항목 | 배제 이유 |
|------|-----------|
| 이메일·비밀번호 가입/로그인 | Google·Kakao OAuth 전략과 충돌, 비밀번호 관리 부담 |
| 닉네임 변경 API | IdP 표시명으로 충분, 마이페이지는 활동·후원 중심 |
| Chart.js / 그래프 대시보드 | 달성률·신뢰 바로 충분, 관리자는 숫자 카드 제공 |
| 다크모드 | 데모·브랜드 일관성, docs 무관 |
| 다국어 (i18n) | 한국어 단일 시장 대상 |
| Flutter급 디자인 시스템 | Express+바닐라 데모, `:root` CSS 변수 수준 유지 |

### In Progress (진행 중 / 부분 구현)

- **결제 (PG 미연동)** — 결제 수단 UI만 존재, 실제 PG·은행 API 없이 후원 기록만 DB에 저장
- **프로젝트 심사** — 관리자 승인/거절 API·`admin.html` 구현 완료 (일반 사용자는 심사 불가)
- **덕질 온도 (신뢰 지표)** — UI 표시만, 후원·성공·리뷰 기반 동적 계산 로직 없음
- **정산 완료 (`released`)** — 후원 상태·배지 UI는 있으나, `holding` → `released` 전환 API 없음
- **신규 등록 프로젝트 노출** — 메인 추천 목록(`featured: true`)에 자동 포함되지 않음, 마이페이지에서만 확인 가능
- **검색·필터 고도화** — 기본 페이지네이션·정렬은 적용됨, 복합 필터·추천 알고리즘은 예정

### To Do (예정 / 미구현)

- **MongoDB·정식 스키마** — 프로덕션용 User/Project/Donation 분리 스키마, 마이그레이션 (현재 SQLite + JSON 컬럼 데모 구조)
- **관리자 (Admin)** — 기본 심사·승인/거절 구현 완료. 전체 후원 강제 정산·운영 대시보드 확장은 예정
- **검색·필터 API 확장** — 페이지네이션, 복합 정렬
- **실결제·분할 정산** — PG 연동 (토스/카카오페이 등), 단계별 분할 정산 실행, 목표 미달·무산 자동 환불
- **프로젝트·사용자 API 확장** — 목록 조회, 수정, 삭제, 프로필 CRUD
- **기획서 기능** (`docs/`) — 입장 QR, 행사 위치 공유, 후기 기반 신뢰도, 소상공인·엔터사 매칭, 플랫폼 수수료
- **기술 스택 전환** — Flutter 프론트엔드, FastAPI 백엔드, GCP 배포 (기획 단계)
- **테스트·CI** — 단위/통합/E2E 테스트, CI 파이프라인
- **인프라** — Docker, 로깅·모니터링

## 데모 안내

- OAuth·후원 결제·환불·프로젝트 등록은 **시뮬레이션**이며 SQLite에 저장됩니다. 실제 PG 결제는 없습니다.
- 소셜 로그인은 **Mock 없이 실제 OAuth만** 지원합니다. `.env` 미설정 시 `oauth-setup.html` 안내 페이지로 이동합니다.
- 메인 네비·카테고리 숏컷·검색은 `GET /api/projects`로 실제 필터링됩니다. 게시글은 `detail.html?tab=community&post={id}`로 상세 이동합니다.
- 서버 재시작 후에도 `data/duckrowd.db`에 저장된 프로젝트·후원·로그인 세션이 유지됩니다. DB를 삭제하면 최초 실행 시 샘플 10개 프로젝트가 다시 시드됩니다.

## 문제 해결

| 증상 | 확인 사항 |
|------|-----------|
| `npm: command not found` | Node.js 설치 후 터미널을 다시 열기 |
| `EADDRINUSE` (포트 사용 중) | 3000 포트를 쓰는 다른 프로세스 종료 또는 `PORT` 변경 |
| 페이지는 뜨는데 목록이 비어 있음 | 서버가 실행 중인지 확인 (`npm start`). `file://`로 HTML을 직접 열지 말고 `http://localhost:3000`으로 접속 |
| `Cannot find module 'express'` | 프로젝트 루트에서 `npm install` 재실행 |

## 라이선스

데모/프로토타입 용도입니다. 별도 라이선스 파일이 없으면 저장소 소유자 정책을 따릅니다.
