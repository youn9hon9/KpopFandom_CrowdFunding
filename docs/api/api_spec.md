# RESTful API Specification (Express Endpoints)

이 문서는 Duckrowd 플랫폼 백엔드가 제공하는 주요 API 엔드포인트 사양 및 입출력 페이로드 규격서입니다.

---

## 1. Global Response Format (글로벌 표준 응답 규격)

### 성공 응답 (200 OK, 201 Created)
모든 데이터 반환은 JSON 오브젝트 구조를 취합니다.
```json
{
  "success": true,
  "data": { ... }
}
```

### 실패 응답 (400, 401, 403, 404, 500)
실패 시에는 항상 에러 코드와 사람이 읽을 수 있는 메시지를 반환합니다.
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED_ACCESS",
    "message": "소셜 로그인이 해제되었거나 세션이 만료되었습니다."
  }
}
```

---

## 2. Core API Endpoints (핵심 API 명세)

### ① GET `/api/projects` (프로젝트 목록 조회)
필터 및 검색어 조건을 통해 프로젝트 목록을 페이지네이션 형태로 가져옵니다.
- **Query Parameters**:
  - `category`: 'cafe' | 'subway' | 'bus' | 'exhibition' (선택)
  - `search`: 검색 키워드 (선택)
  - `sort`: 'popular' | 'latest' | 'featured' (선택)
- **Response Example (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "title": "지민 생일 축하 컵홀더",
        "category": "cafe",
        "target_amount": 5000000,
        "current_amount": 4350000,
        "thumbnail_url": "/images/jimin_cafe.jpg",
        "end_date": "2026-06-25T12:00:00.000Z",
        "host_name": "아미연대"
      }
    ]
  }
  ```

### ② POST `/api/projects/:id/sponsor` (후원 결제)
로그인 세션이 유효한 상태에서 특정 프로젝트에 가상 결제 및 후원을 등록합니다. (에스크로 상태로 보존)
- **Authentication**: 필수 (`HttpOnly Session Cookie`)
- **Request Body**:
  ```json
  {
    "amount": 30000,
    "payment_method": "kakaopay"
  }
  ```
- **Response Example (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "donation_id": 482,
      "project_id": 1,
      "amount": 30000,
      "status": "holding",
      "payout_status": "payout_holded",
      "created_at": "2026-06-09T21:24:00.000Z"
    }
  }
  ```

### ③ POST `/api/donations/:id/refund` (후원 강제 환불)
보관 상태(`holding`)인 특정 후원을 환불 조치하고 펀딩 누적액을 롤백합니다.
- **Authentication**: 필수 (자신이 기부한 기부건이거나, 관리자 권한만 가능)
- **Response Example (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "donation_id": 482,
      "status": "refunded",
      "refund_amount": 30000,
      "refunded_at": "2026-06-09T21:25:12.000Z"
    }
  }
  ```

---

## 3. To-Be Advanced API Endpoints (추가 개발 예정 스펙)

### ① POST `/api/tickets/verify` (입장 QR 티켓 오프라인 검증)
행사장 현장에서 스캔된 후원자의 QR 코드를 확인 및 중복 입장 방지 체크를 수행합니다.
- **Authentication**: 필수 (행사 총대 스태프 계정 권한 확인)
- **Request Body**:
  ```json
  {
    "qr_ticket_code": "dq-f7b2-921a-e55d"
  }
  ```
- **Response Example (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "verified": true,
      "attendance_time": "2026-06-09T21:26:00.000Z",
      "sponsor_name": "홍길동",
      "reward_option": "Premium Ticket"
    }
  }
  ```

### ② GET `/api/projects/map` (주변 행사 위치 조회)
현재 브라우저 GPS 좌표 기반 주변 5km 이내에서 활성화되어 진행 중인 이벤트 위치 정보를 전달합니다.
- **Query Parameters**:
  - `lat`: 위도 (예: 37.4979)
  - `lng`: 경도 (예: 127.0276)
- **Response Example (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "project_id": 1,
        "title": "지민 생일 축하 컵홀더",
        "latitude": 37.4982,
        "longitude": 127.0281,
        "address": "서울특별시 강남구 테헤란로 123 카페 아미"
      }
    ]
  }
  ```
