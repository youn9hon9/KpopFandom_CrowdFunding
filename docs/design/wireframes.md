# UI Wireframe & Layout Architecture Specs

이 문서는 Duckrowd 플랫폼 핵심 화면의 UI 레이아웃 그리드 구성 및 구조화 가이드라인입니다. 각 화면은 CSS Flexbox 및 Grid 아키텍처를 기반으로 설계되었습니다.

---

## 1. Main Dashboard Layout (메인 홈 페이지)

```
+-------------------------------------------------------------------------+
| [D] DUCKROWD                      [Search Project...]    [Login/MyPage] |  <- Header (Sticky, Glassmorphism)
+-------------------------------------------------------------------------+
|                                                                         |
|   +-----------------------------------------------------------------+   |
|   |                  Hero Carousel: Featuring Artist                |   |  <- Slider Section (Auto/Manual Navigation)
|   +-----------------------------------------------------------------+   |
|                                                                         |
|   Category Shortcuts:   [All]   [Cup Holder]   [Ad Subway]   [Exhibition]  <- Navigation Chips
|                                                                         |
|   +-------------------+  +-------------------+  +-------------------+   |
|   | [Img: Birthday]   |  | [Img: Bus Wrap]   |  | [Img: Cafe Event] |   |  <- Project Card Grid (3-Columns)
|   | 87% (4,350,000₩)  |  | 102% (8,160,000₩) |  | 12% (600,000₩)    |   |  (Glassmorphism Card Structure)
|   | 14 Days Left      |  | 2 Days Left       |  | 30 Days Left      |   |
|   +-------------------+  +-------------------+  +-------------------+   |
+-------------------------------------------------------------------------+
```

### 🧱 주요 컴포넌트 마크업 사양
- **Header**: `position: sticky; top: 0; z-index: 1000;` 구조에 투명 배경 및 블러 효과 적용.
- **Card Grid Container**:
  ```css
  .project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
    padding: 40px 0;
  }
  ```

---

## 2. Project Detail & Community Layout (상세 및 커뮤니티 페이지)

상세 정보는 좌측 본문/커뮤니티 내용부와 우측 펀딩 지표/후원 패널(Sidebar)로 나뉘는 2컬럼 레이아웃입니다.

```
+-------------------------------------------------------------------------+
| <-- Back to Main       [프로젝트 타이틀 및 총대 프로필]                 |
+-------------------------------------------------------------------------+
|                                        |                                |
|  Tab: [Story] [Community] [Refund]     |  [ 💸 Funding Panel (Sticky) ] |
|  +----------------------------------+  |  달성률: 87%                   |
|  | (Active Tab Content Area)        |  |  달성액: 4,350,000 원          |
|  |                                  |  |  남은 기간: 14일               |
|  | - Story: 이미지 및 기획 텍스트   |  |  총 후원자 수: 142명           |
|  | - Community: 투표 / 공지사항     |  |                                |
|  | - Refund: 약관 확인              |  |  [ 💖 후원하기 (Button) ]      |
|  +----------------------------------+  |                                |
+-------------------------------------------------------------------------+
```

### 🧱 상세 페이지 분기 뷰 (Community Tab)
- **Notice Section**: 총대가 작성한 중요 공지가 상단 핀 고정 카드로 노출.
- **Schedules Section**: 타임라인 UI 컴포넌트로 행사 일정(대관일, 물품 수령일, 세팅 시간 등) 흐름 표시.
- **Polls Section**:
  ```html
  <div class="poll-card premium-glass-card">
    <h4>특전 굿즈 선호도 조사</h4>
    <div class="poll-option" onclick="vote(1)">A안: 아크릴 키링 (42%)</div>
    <div class="poll-option" onclick="vote(2)">B안: 포토카드 데코북 (58%)</div>
  </div>
  ```

---

## 3. Funding Payment Modal (결제 시뮬레이터 팝업)

사용자가 '후원하기' 버튼을 누르면 화면 중앙에 팝업 형태로 Glassmorphism 결제 모달이 페이드인됩니다.

```
+----------------------------------------------------------+
|  [X] Close                                               |
|                    Select Support Reward                 |
|                                                          |
|   ( ) 15,000₩ - Standard Ticket (컵홀더 + 포토카드)      |
|   ( ) 30,000₩ - Premium Ticket (컵홀더 + 포카 + 아크릴)   |
|   ( ) Custom Amount: [                 ] ₩               |
|                                                          |
|   Payment Method: [ Kakao Pay ] [ Credit Card ]          |
|                                                          |
|   [ Confirm & Pay ]                                      |
+----------------------------------------------------------+
```
- **Modal Wrapper**: `display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px);`로 모달 뒤 배경을 블러 처리하여 핵심 조작 영역에 몰입감을 유도합니다.
