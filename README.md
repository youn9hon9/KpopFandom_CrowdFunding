# Duckrowd

K-POP 팬 주최 이벤트 C2C 크라우드펀딩 **데모** 웹 애플리케이션입니다.  
Express 서버가 정적 페이지와 샘플 API를 제공하며, 프로젝트 데이터는 서버 메모리에 하드코딩되어 있습니다.

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

### 3. 서버 시작

```bash
npm start
```

터미널에 `Duckrowd demo server running at http://localhost:3000` 이 출력되면 정상입니다.

### 4. 브라우저에서 접속

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
| GET | `/api/projects/featured` | 추천 프로젝트 목록 |
| GET | `/api/projects/popular` | 인기 프로젝트 목록 |
| GET | `/api/projects/:id` | 프로젝트 상세 (예: `/api/projects/1`) |

## 프로젝트 구조

```
.
├── server.js          # Express 서버 및 샘플 데이터·API
├── package.json
├── public/
│   ├── index.html     # 메인 페이지
│   ├── detail.html    # 상세 페이지
│   ├── script.js      # 메인 페이지 스크립트
│   ├── detail.js      # 상세 페이지 스크립트
│   └── style.css      # 스타일
└── README.md
```

## 데모 안내

- 로그인, 결제, 프로젝트 등록 등은 UI만 있으며 실제 동작하지 않습니다 (`data-demo` 버튼).
- 데이터베이스 없음 — 서버 재시작 시에도 `server.js`의 샘플 데이터가 그대로 사용됩니다.
- 검색·필터 등 일부 네비게이션 링크는 데모용입니다.

## 문제 해결

| 증상 | 확인 사항 |
|------|-----------|
| `npm: command not found` | Node.js 설치 후 터미널을 다시 열기 |
| `EADDRINUSE` (포트 사용 중) | 3000 포트를 쓰는 다른 프로세스 종료 또는 `PORT` 변경 |
| 페이지는 뜨는데 목록이 비어 있음 | 서버가 실행 중인지 확인 (`npm start`). `file://`로 HTML을 직접 열지 말고 `http://localhost:3000`으로 접속 |
| `Cannot find module 'express'` | 프로젝트 루트에서 `npm install` 재실행 |

## 라이선스

데모/프로토타입 용도입니다. 별도 라이선스 파일이 없으면 저장소 소유자 정책을 따릅니다.
