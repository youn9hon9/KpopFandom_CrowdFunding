# Antigravity Agent Execution & Troubleshooting Log

**Session ID**: `agent-run-20260609-2122`  
**Agent Core**: Antigravity Developer Core (v3.5)  
**Task**: Duckrowd MVP Refactoring & Verification

본 로그는 Antigravity 에이전트(LLM OS CPU)가 Duckrowd 코드를 빌드하고 수정한 과정에서 발생한 핵심 트러블슈팅 사례와 해결 과정을 벨로그/티스토리의 기술 블로그 형식으로 아카이빙한 것입니다.

---

## 🪵 Session Log 01: OAuth 2.0 State Mismatch & Session Disruption

### 🚨 Issue Description (문제 현상)
소셜 로그인 진행 후 콜백 엔드포인트(`/auth/google/callback`)로 리다이렉트될 때, 서버 콘솔에 `OAuth State Mismatch: expected {xxx}, got {yyy}` 또는 `Session destroyed` 에러가 무작위로 출력되며 로그인이 최종 401 Unauthorized로 튕기는 현상 발생.

### 🔍 Root Cause Analysis (원인 분석)
- **현상 추적**: OAuth 흐름 시 CSRF 공격을 방지하기 위해 생성하는 난수 `state` 값과 `code_verifier`를 Express `req.session`에 임시 보존한다.
- **원인**: 현재 세션 저장소로 `better-sqlite3` 기반의 DB 테이블을 사용 중이나, 로컬 Node.js 서버 개발 환경에서 코드 수정 후 Nodemon에 의해 서버가 재시작될 때 메모리가 완전 초기화되거나, SQLite 파일에 동시 접근 시 세션 락이 걸리며 세션 테이블이 세션 데이터를 순간적으로 읽어오지 못함. 이로 인해 브라우저의 쿠키 ID와 매핑된 세션 컨텍스트가 증발하여 `state` 검증에 실패함.
- **참고 기술 블로그 트렌드**: 
  - Express-session 사용 시 기본 `MemoryStore`는 서버 재시작 시 세션이 다 날아가기 때문에 소셜 로그인 중 Nodemon이 돌면 무조건 로그인 에러가 남.
  - SQLite 세션 스토어 사용 시 트랜잭션이 충돌하면 세션 데이터 업데이트 쿼리가 롤백되어 세션 풀림 현상이 생김.

### 🛠️ Resolution & Hotfix Implementation (해결 방안)
1. **세션 저장소 무결성 확보**: Express 세션 미들웨어에 `resave: false`, `saveUninitialized: false` 옵션을 명확히 주어 세션 데이터가 불필요하게 덮어써지지 않도록 수정.
2. **SQLite DB 재시도 로직 설정**: `lib/database.js`에서 SQLite 커넥션을 초기화할 때 DB 파일 충돌을 막기 위해 타임아웃 캐시 적용.
3. **가상 검증**:
   ```javascript
   // lib/oauth.js 수정 부분 
   if (req.session.state !== queryState) {
     console.error(`[Error] State Mismatch. Expected: ${req.session.state}, Got: ${queryState}`);
     // 단순 튕김 대신 에러 세션을 재시작 유도
     return res.redirect('/oauth-setup.html?error=state_mismatch');
   }
   ```

---

## 🪵 Session Log 02: SQLite `SQLITE_BUSY: database is locked` 예외

### 🚨 Issue Description (문제 현상)
동일한 프로젝트에 다수의 사용자가 1초 안에 동시에 후원 결제(`POST /api/projects/:id/sponsor`) 버튼을 클릭하는 동시성 부하 테스트 시나리오에서, 백엔드가 500 에러를 뿜으며 `SqliteError: database is locked` 예외를 발생시키고 커넥션이 중단됨.

### 🔍 Root Cause Analysis (원인 분석)
- **SQLite 동시성 구조**: SQLite는 기본적으로 파일 단위 락을 공유한다. 특히 트랜잭션을 수반하는 `INSERT`/`UPDATE` 작업 시 데이터베이스 파일 전체가 단독 쓰기 잠금(Exclusive Lock) 상태가 된다.
- **원인**: 여러 클라이언트가 동시에 후원을 진행하면, (1) `donations` 테이블에 데이터 삽입, (2) `projects` 테이블의 `current_amount` 업데이트가 한 번에 일어나 연속 쓰기가 시작된다. 이때 다른 쓰기 트레드가 락 점유를 시도하다가 즉시 실패하여 `SQLITE_BUSY`를 리턴함.

### 🛠️ Resolution & Hotfix Implementation (해결 방안)
1. **WAL(Write-Ahead Logging) 모드 적용**: SQLite의 저널링 모드를 기본 `DELETE`에서 `WAL`로 전환한다. 이 모드에서는 리더(Reader)와 라이터(Writer)가 서로를 블로킹하지 않고 동시 처리가 가능하다.
2. **Busy Timeout 지정**: 데이터베이스 연결 시 락이 해제될 때까지 프로세스가 기다릴 수 있는 버퍼 시간(`timeout: 5000`ms)을 부여한다.

```javascript
// lib/database.js 수정 내용
const Database = require('better-sqlite3');
const db = new Database(dbPath, { timeout: 5000 }); // 락 대기 시간 5초 적용

// WAL 모드 활성화로 동시성 처리량 극대화
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
```

---

## 🪵 Session Log 03: Safari / iOS 환경에서 세션 쿠키 유실 (SameSite 크로스 사이트이슈)

### 🚨 Issue Description (문제 현상)
Chrome 브라우저에서는 정상적으로 로그인 상태가 유지되나, Safari 브라우저 또는 모바일 기기 브라우저에서 사이트 재접속 시 로그인이 계속 풀리고 세션 쿠키가 클라이언트에 저장되지 않는 보안 예외 발생.

### 🔍 Root Cause Analysis (원인 분석)
- **보안 정책 변화**: Apple의 ITP(Intelligent Tracking Prevention) 및 모던 브라우저의 보안 정책으로 인해, `https` 프로토콜이 아니거나 SameSite 설정이 모호한 세션 쿠키는 서드파티 크로스 도메인 유도 상황에서 쿠키 인가를 거부한다.
- **원인**: 카카오/구글 로그인 리다이렉트 후 콜백 페이지에서 최종 세션 쿠키를 바인딩할 때, 세션 쿠키의 `SameSite` 속성이 누락되었거나 `Secure` 속성이 로컬 환경(`http://localhost:3000`)의 특성을 고려하지 않고 엄격하게 세팅되어 브라우저에 의해 파기됨.

### 🛠️ Resolution & Hotfix Implementation (해결 방안)
- 로컬 개발 환경과 실제 상용 도메인의 SSL 적용 상태를 자동 판별하여 쿠키 옵션을 동적으로 조정하는 미들웨어 유틸리티 탑재.

```javascript
// server.js의 Express Session Cookie 설정 수정
app.use(session({
  store: new SqliteStore({ client: db }),
  secret: process.env.SESSION_SECRET || 'duckrowd-default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24시간
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // 프로덕션 HTTPS에서만 secure 활성화
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));
```

---

## 🪵 Session Log 04: 상세 페이지(/projects/:id) 리소스 로드 404 및 화면 깨짐 현상

### 🚨 Issue Description (문제 현상)
사용자가 상세 페이지(예: `http://localhost:3000/projects/1`)에 접속하였을 때, 화면 전체가 렌더링되지 않고 하얗게 뜨며 브라우저 콘솔에서 `routes.js`, `detail.js`, `style.css` 리소스를 불러오는 중 404 Not Found 에러가 다발적으로 발생함.

### 🔍 Root Cause Analysis (원인 분석)
- **현상 추적**: `server.js`에 설정된 Express 라우트는 `/projects/:id` 경로로 HTML을 전송한다.
  ```javascript
  app.get('/projects/:id', (req, res) => {
    res.sendFile(path.join(publicDir, 'detail.html'));
  });
  ```
- **원인**: `detail.html` 내부에서 CSS 및 JS 스크립트 파일을 로딩할 때 `src="routes.js"`, `href="style.css"` 처럼 상대 경로(Relative Path)를 사용하고 있었음. 이로 인해 브라우저는 루트 주소(`/`)가 아닌 현재 URL 디렉토리 주소인 `/projects/` 하위에서 파일들을 찾으려고 시도하여 `/projects/routes.js` 등의 잘못된 경로로 HTTP 요청을 전송하게 됨. Express static 미들웨어는 이 경로에 대응하는 정적 파일이 없으므로 404 에러를 던져 스크립트 실행이 중단됨.

### 🛠️ Resolution & Hotfix Implementation (해결 방안)
- `public/detail.html` 내부의 모든 CSS 및 JS 리소스 로딩 경로에 앞서 슬래시(`/`)를 붙여 **절대 경로(Absolute Path)**로 명시하도록 변경함.

```html
<!-- public/detail.html 수정 -->
<link rel="stylesheet" href="/style.css">
...
<script src="/routes.js"></script>
<script src="/errors.js"></script>
<script src="/detail.js"></script>
```
*결과: 브라우저가 중첩된 경로(`/projects/1` 등)에서도 항상 사이트 루트 디렉토리로부터 리소스를 가져오게 되어 렌더링이 성공적으로 재개됨.*

