# Database Schema & Migration Guide (SQLite to MongoDB)

이 설계서는 Duckrowd 플랫폼이 제공하는 모든 데이터 모델의 SQLite 릴레이셔널 테이블 사양과 향후 상용화를 대비한 MongoDB(NoSQL)로의 데이터 마이그레이션 방향을 기술합니다.

---

## 1. SQLite Table Schemas (현재 MVP 사양)

현재 SQLite에서 트랜잭션 안전성과 데이터 관계를 영속화하기 위해 사용하는 스키마 구조입니다.

### ① Users Table (사용자 계정 정보)
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,               -- IdP 제공 고유 식별자 (OAuth ID)
    email TEXT UNIQUE NOT NULL,        -- 소셜 로그인 이메일
    display_name TEXT NOT NULL,       -- 화면 표시 닉네임
    role TEXT DEFAULT 'user',          -- 'user' | 'admin' (권한 제어)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### ② Projects Table (펀딩 프로젝트 정보)
```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,            -- 'cafe' | 'subway' | 'bus' | 'exhibition'
    target_amount INTEGER NOT NULL,     -- 목표 금액
    current_amount INTEGER DEFAULT 0,  -- 현재 누적 모금액
    thumbnail_url TEXT,                -- 대표 썸네일 이미지
    story TEXT,                        -- 상세 설명 본문 (Markdown 지원)
    budget_plan TEXT,                  -- 예산 사용처 명세서 (JSON String)
    refund_policy TEXT,                -- 환불 특별 약관
    host_user_id TEXT,                 -- 개설자 (users.id FK)
    status TEXT DEFAULT 'pending',     -- 'pending' (심사 중) | 'active' (모금 중) | 'rejected' (심사 탈락) | 'success' (달성 성공) | 'failed' (기간 종료 미달성)
    latitude REAL,                     -- [To-Be] 지도 핀 표시용 위도
    longitude REAL,                    -- [To-Be] 지도 핀 표시용 경도
    end_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(host_user_id) REFERENCES users(id)
);
```

### ③ Donations Table (후원 내역 및 에스크로 정보)
```sql
CREATE TABLE donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    user_id TEXT,
    amount INTEGER NOT NULL,
    payment_method TEXT NOT NULL,      -- 'kakaopay' | 'card'
    status TEXT DEFAULT 'holding',     -- 'holding' (에스크로 동결) | 'released' (정산 완료) | 'refunded' (환불 처리 완료)
    qr_ticket_code TEXT UNIQUE,        -- [To-Be] 입장 확인용 고유 난수 코드
    qr_verified INTEGER DEFAULT 0,     -- [To-Be] 1이면 입장 체크인 완료, 0이면 미입장
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

### ④ Community Tables (공지, 투표 및 게시판)
```sql
-- 커뮤니티 게시글 및 일정/공지 통합 테이블
CREATE TABLE community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    author_id TEXT,
    type TEXT DEFAULT 'free',          -- 'free' (일반) | 'notice' (공지) | 'schedule' (일정) | 'poll' (투표)
    title TEXT,
    content TEXT,
    poll_options TEXT,                 -- 투표 항목들 (JSON Array String: ["A안", "B안"])
    event_date DATETIME,               -- 일정인 경우 이벤트 예약일
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(author_id) REFERENCES users(id)
);
```

---

## 2. To-Be Advanced Schema Extensions (고도화 스키마)

### 🎫 입장 검증 티켓 및 정산 관리 테이블
```sql
-- 분할 정산 처리 로그 테이블
CREATE TABLE payout_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    stage INTEGER,                     -- 1차, 2차, 3차 정산 여부
    amount_paid INTEGER,
    evidence_url TEXT,                 -- 증빙 문서 영수증 이미지 경로
    verified_by_agent INTEGER,         -- 에이전트 1차 심사 통과 여부 (0 | 1)
    status TEXT DEFAULT 'pending',     -- 'pending' | 'completed'
    paid_at DATETIME,
    FOREIGN KEY(project_id) REFERENCES projects(id)
);
```

---

## 3. Migration to MongoDB Strategy (NoSQL 전환 전략)

이후 대규모 분산 환경을 위한 MongoDB 전환 시, 릴레이션 테이블은 다음과 같은 도큐먼트 모델로 통합(Denormalization)되어 읽기 쿼리를 최소화합니다.

```json
// MongoDB "projects" Collection Schema
{
  "_id": "ObjectId",
  "title": "지민 생일 축하 컵홀더 이벤트",
  "category": "cafe",
  "target_amount": 5000000,
  "current_amount": 4350000,
  "status": "active",
  "host": {
    "user_id": "oauth-google-12345",
    "display_name": "침침총대",
    "fandom_temperature": 36.5
  },
  "location": {
    "type": "Point",
    "coordinates": [127.0276, 37.4979]
  },
  "community": [
    {
      "post_id": 1,
      "type": "notice",
      "title": "현장 수령 굿즈 안내",
      "content": "선착순 100명에게 포카 세트를 증정합니다."
    }
  ]
}
```
*이유: 관계형 DB의 잦은 Join 연산을 방지하고, 펀딩 진행률이 실시간으로 갱신될 때 단일 문서 쓰기 트랜잭션으로 빠르게 동시 수정을 수용할 수 있습니다.*
