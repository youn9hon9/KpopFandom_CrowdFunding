function getSeedProjects() {
  return [
    {
      id: 1,
      title: '서울 강남역 2호선 생일 카페 — 하루 종일 팬 이벤트',
      category: '생일카페',
      hostName: '별빛총대',
      trustTemperature: 91,
      successCount: 12,
      status: '펀딩 진행 중',
      goalAmount: 8000000,
      currentAmount: 6240000,
      percentFunded: 78,
      daysLeft: 9,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      emoji: '🎂',
      featured: true,
      popularRank: 1,
      story: `<p>최애의 생일을 맞아 강남역 인근 카페 전층을 팬 이벤트 공간으로 꾸밉니다.</p>
<p>포토존, 포토카드 교환 데스크, 생일 케이크 커팅 타임까지 준비했습니다. 모든 정산은 덕라우드 안전 결제를 통해 투명하게 진행됩니다.</p>
<p>목표 달성 시 추가 굿즈(컵홀더 세트)가 후원자 전원에게 제공됩니다.</p>`,
      community: {
        notices: [
          { date: '2026-05-20', title: '카페 예약 확정 안내', body: '5/28~5/30 3일간 예약이 완료되었습니다.' },
          { date: '2026-05-15', title: '굿즈 시안 공개', body: '컵홀더 디자인 투표 결과를 반영했습니다.' }
        ],
        schedules: [
          {
            id: 'sched-seed-1',
            title: '생일 카페 오픈',
            eventDate: '2026-05-28',
            eventTime: '10:00',
            location: '강남역 인근 카페',
            description: '포토존·굿즈 교환 데스크 운영',
            authorName: '별빛총대',
            createdAt: '2026-05-01T00:00:00.000Z'
          },
          {
            id: 'sched-seed-2',
            title: '케이크 커팅 타임',
            eventDate: '2026-05-29',
            eventTime: '15:00',
            location: '같은 카페 2층',
            description: '후원자 전원 참여 가능',
            authorName: '별빛총대',
            createdAt: '2026-05-01T00:00:00.000Z'
          }
        ],
        polls: [
          {
            id: 'poll-seed-1',
            question: '생일 케이크 디자인은 어떤 스타일이 좋을까요?',
            options: [
              { label: '클래식 화이트', votes: 142 },
              { label: '포인트 컬러 그라데이션', votes: 218 },
              { label: '미니 캐릭터 피규어', votes: 95 }
            ],
            voters: {}
          }
        ],
        posts: []
      },
      refundPolicy: '목표 금액 미달성 시 전액 자동 환불됩니다. 펀딩 종료 후 7영업일 이내 결제 수단으로 환불 처리됩니다. 무산 확정 시에도 동일 정책이 적용됩니다.'
    },
    {
      id: 2,
      title: '홍대입구역 커피차 — 500잔 응원 이벤트',
      category: '커피차',
      hostName: '달빛응원단',
      trustTemperature: 88,
      successCount: 8,
      status: '펀딩 진행 중',
      goalAmount: 5500000,
      currentAmount: 4950000,
      percentFunded: 90,
      daysLeft: 4,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      emoji: '☕',
      featured: true,
      popularRank: 2,
      story: `<p>컴백 주간 홍대입구역 앞에서 아티스트와 스태프를 위한 커피차를 운영합니다.</p>
<p>음료 500잔 + 간식 세트, 스태프용 에너지 드링크를 포함한 패키지입니다.</p>`,
      community: {
        notices: [
          { date: '2026-05-22', title: '커피차 업체 계약 완료', body: '메뉴 구성은 투표 결과를 반영합니다.' }
        ],
        schedules: [
          {
            id: 'sched-seed-2a',
            title: '커피차 운영',
            eventDate: '2026-06-05',
            eventTime: '11:00',
            location: '홍대입구역 2호선',
            description: '음료 500잔 배포 시작',
            authorName: '달빛응원단',
            createdAt: '2026-05-01T00:00:00.000Z'
          },
          {
            id: 'sched-seed-2b',
            title: '스태프 응원 세트 전달',
            eventDate: '2026-06-05',
            eventTime: '14:00',
            location: '홍대입구역 사거리',
            description: '스태프용 에너지 드링크 전달',
            authorName: '달빛응원단',
            createdAt: '2026-05-01T00:00:00.000Z'
          }
        ],
        polls: [
          {
            id: 'poll-1',
            question: '대표 음료 메뉴를 골라주세요',
            options: [
              { label: '아메리카노', votes: 89 },
              { label: '라떼', votes: 201 },
              { label: '에이드', votes: 156 }
            ]
          }
        ]
      },
      refundPolicy: '이벤트 취소 시 전액 환불. 부분 진행 불가 시 남은 금액 비례 환불 후 안내드립니다.'
    },
    {
      id: 3,
      title: '신사역 7호선 지하철 스크린도어 광고',
      category: '지하철광고',
      hostName: '역사팬클럽',
      trustTemperature: 85,
      successCount: 5,
      status: '펀딩 진행 중',
      goalAmount: 12000000,
      currentAmount: 7200000,
      percentFunded: 60,
      daysLeft: 18,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      emoji: '🚇',
      featured: true,
      popularRank: 3,
      story: `<p>생일 주간 신사역 스크린도어에 축하 영상·이미지를 2주간 게재합니다.</p>
<p>디자인 시안은 커뮤니티 투표로 확정됩니다.</p>`,
      community: {
        notices: [
          { date: '2026-05-10', title: '광고 심의 서류 제출', body: '심의 통과 후 일정이 확정됩니다.' }
        ],
        schedules: [
          {
            id: 'sched-seed-3a',
            title: '스크린도어 광고 게재 시작',
            eventDate: '2026-06-10',
            eventTime: '06:00',
            location: '신사역 7호선',
            description: '2주간 축하 영상·이미지 게재',
            authorName: '역사팬클럽',
            createdAt: '2026-05-01T00:00:00.000Z'
          }
        ],
        polls: []
      },
      refundPolicy: '광고 심의 불통과 시 전액 환불. 통과 후 일정 변경은 호스트 공지 후 협의합니다.'
    },
    {
      id: 4,
      title: '앨범 공동구매 + 응원 포스터 세트',
      category: '앨범공구',
      hostName: '앨범마스터',
      trustTemperature: 79,
      successCount: 15,
      status: '펀딩 진행 중',
      goalAmount: 3200000,
      currentAmount: 2560000,
      percentFunded: 80,
      daysLeft: 12,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      emoji: '💿',
      featured: true,
      popularRank: 4,
      story: `<p>신규 미니앨범 공구 및 응원 포스터 번들 패키지입니다.</p>`,
      community: {
        notices: [{ date: '2026-05-18', title: '발주 수량 집계 중', body: '마감 D-12 기준 80% 달성' }],
        schedules: [
          {
            id: 'sched-seed-4a',
            title: '공구 수령·포스터 배부',
            eventDate: '2026-06-15',
            eventTime: '13:00',
            location: '강남역 2호선',
            description: '앨범·포스터 세트 현장 수령',
            authorName: '앨범마스터',
            createdAt: '2026-05-01T00:00:00.000Z'
          }
        ],
        polls: []
      },
      refundPolicy: '발주 전 취소 시 전액 환불. 발주 후에는 제작 특성상 환불이 제한될 수 있습니다.'
    },
    {
      id: 5,
      title: '전국 카페 컵홀더 콜라보 — 50개 매장',
      category: '컵홀더',
      hostName: '컵홀더연합',
      trustTemperature: 82,
      successCount: 6,
      status: '펀딩 진행 중',
      goalAmount: 4500000,
      currentAmount: 3150000,
      percentFunded: 70,
      daysLeft: 15,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      emoji: '🥤',
      featured: true,
      popularRank: 5,
      story: `<p>전국 50개 제휴 카페에서 한정 컵홀더를 배포합니다.</p>`,
      community: {
        notices: [],
        schedules: [
          {
            id: 'sched-seed-5a',
            title: '서울 킥오프 — 컵홀더 배포',
            eventDate: '2026-06-08',
            eventTime: '10:00',
            location: '연남동 카페거리',
            description: '서울권 제휴 카페 10곳 배포 시작',
            authorName: '컵홀더연합',
            createdAt: '2026-05-01T00:00:00.000Z'
          }
        ],
        polls: []
      },
      refundPolicy: '목표 미달성 시 전액 자동 환불.'
    },
    {
      id: 6,
      title: '올림픽공원 응원봉 커스텀 컬러 펀딩',
      category: '응원봉',
      hostName: '빛나는총대',
      trustTemperature: 76,
      successCount: 4,
      status: '심사 중',
      goalAmount: 6000000,
      currentAmount: 0,
      percentFunded: 0,
      daysLeft: 30,
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      emoji: '✨',
      featured: true,
      popularRank: null,
      story: `<p>공식 응원봉 커스텀 컬러 제작 건입니다. 현재 플랫폼 심사 중이며 승인 후 펀딩이 시작됩니다.</p>`,
      community: {
        notices: [{ date: '2026-05-25', title: '심사 진행 안내', body: '예상 3~5일 소요' }],
        schedules: [
          {
            id: 'sched-seed-6a',
            title: '응원봉 컬러 시연 (예정)',
            eventDate: '2026-07-01',
            eventTime: '18:00',
            location: '올림픽공원',
            description: '심사 승인 후 펀딩 오픈 시 진행 예정',
            authorName: '빛나는총대',
            createdAt: '2026-05-01T00:00:00.000Z'
          }
        ],
        polls: []
      },
      refundPolicy: '심사 단계에서는 결제가 진행되지 않습니다. 펀딩 시작 후 미달성 시 전액 환불.'
    },
    {
      id: 7,
      title: '성수동 팝업 전시회 — 팬아트 & 굿즈',
      category: '전시회',
      hostName: '아트덕후',
      trustTemperature: 73,
      successCount: 3,
      status: '펀딩 진행 중',
      goalAmount: 7000000,
      currentAmount: 4550000,
      percentFunded: 65,
      daysLeft: 21,
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      emoji: '🖼️',
      featured: true,
      popularRank: null,
      story: `<p>팬아트 전시 및 한정 굿즈 판매 공간을 2주간 운영합니다.</p>`,
      community: {
        notices: [],
        schedules: [
          {
            id: 'sched-seed-7a',
            title: '팝업 전시 오픈',
            eventDate: '2026-06-20',
            eventTime: '11:00',
            location: '성수동 카페거리',
            description: '팬아트 전시 및 굿즈 판매',
            authorName: '아트덕후',
            createdAt: '2026-05-01T00:00:00.000Z'
          },
          {
            id: 'sched-seed-7b',
            title: '작가 사인회',
            eventDate: '2026-06-22',
            eventTime: '15:00',
            location: '성수동 수제화거리',
            description: '참여 작가 사인·포토 타임',
            authorName: '아트덕후',
            createdAt: '2026-05-01T00:00:00.000Z'
          }
        ],
        polls: []
      },
      refundPolicy: '전시 취소 시 전액 환불.'
    },
    {
      id: 8,
      title: '부산 서면 생일 광고 빌보드',
      category: '지하철광고',
      hostName: '부산팬연합',
      trustTemperature: 68,
      successCount: 2,
      status: '펀딩 진행 중',
      goalAmount: 9000000,
      currentAmount: 2700000,
      percentFunded: 30,
      daysLeft: 25,
      gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      emoji: '📢',
      featured: true,
      popularRank: null,
      story: `<p>서면 역 일대 옥외 빌보드 생일 축하 광고입니다.</p>`,
      community: {
        notices: [],
        schedules: [
          {
            id: 'sched-seed-8a',
            title: '빌보드 광고 게재',
            eventDate: '2026-06-12',
            eventTime: '00:00',
            location: '부산 서면역',
            description: '서면 역 일대 옥외 빌보드 생일 광고',
            authorName: '부산팬연합',
            createdAt: '2026-05-01T00:00:00.000Z'
          }
        ],
        polls: []
      },
      refundPolicy: '목표 미달성 시 전액 환불.'
    },
    {
      id: 9,
      title: '대구 동성로 커피차 — 야간 응원',
      category: '커피차',
      hostName: '대구덕친구',
      trustTemperature: 58,
      successCount: 1,
      status: '무산/자동 환불 예정',
      goalAmount: 4000000,
      currentAmount: 1200000,
      percentFunded: 30,
      daysLeft: 2,
      gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
      emoji: '🌙',
      featured: true,
      popularRank: null,
      story: `<p>목표 달성이 어려워 무산 처리 예정입니다. 결제하신 분들께는 자동 환불이 진행됩니다.</p>`,
      community: {
        notices: [{ date: '2026-05-26', title: '무산 안내', body: 'D-2 기준 30% 달성으로 무산 절차가 시작됩니다.' }],
        schedules: [
          {
            id: 'sched-seed-9a',
            title: '커피차 운영 (취소 예정)',
            eventDate: '2026-06-01',
            eventTime: '19:00',
            location: '대구 동성로',
            description: '무산 확정 시 일정 취소 및 전액 환불',
            authorName: '대구덕친구',
            createdAt: '2026-05-01T00:00:00.000Z'
          }
        ],
        polls: []
      },
      refundPolicy: '무산 확정 시 100% 자동 환불. 환불은 3~5영업일 내 완료됩니다. 별도 신청 없이 처리됩니다.'
    },
    {
      id: 10,
      title: '기타 — 팬미팅 환영 플래카드 100장 제작',
      category: '기타',
      hostName: '신입총대',
      trustTemperature: 42,
      successCount: 0,
      status: '심사 중',
      goalAmount: 1500000,
      currentAmount: 0,
      percentFunded: 0,
      daysLeft: 45,
      gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
      emoji: '🏳️',
      featured: false,
      popularRank: null,
      story: `<p>첫 프로젝트로 플래카드 제작 펀딩을 준비 중입니다.</p>`,
      community: {
        notices: [],
        schedules: [
          {
            id: 'sched-seed-10a',
            title: '플래카드 제작·배포 (예정)',
            eventDate: '2026-07-10',
            eventTime: '12:00',
            location: '잠실종합운동장',
            description: '심사 통과 후 팬미팅 현장 배포 예정',
            authorName: '신입총대',
            createdAt: '2026-05-01T00:00:00.000Z'
          }
        ],
        polls: []
      },
      refundPolicy: '심사 통과 후 펀딩 오픈. 미달성 시 전액 환불.'
    }
  ];
}

const SEED_ARTISTS_BY_ID = {
  1: '에스파',
  2: '아이브',
  3: 'BTS',
  4: '코르티스',
  5: '빅뱅',
  6: '한로로',
  7: '지코',
  8: '비와이',
  9: '데이식스',
  10: 'QWER'
};

function normalizeSeedProjects(projects) {
  projects.forEach((p) => {
    if (p.hostUserId === undefined) p.hostUserId = null;
    if (!p.reviewNotes) p.reviewNotes = [];
    if (!p.rejectedReason) p.rejectedReason = '';
    if (!p.artist) p.artist = SEED_ARTISTS_BY_ID[p.id] || null;
  });

  const project6 = projects.find((p) => p.id === 6);
  const project10 = projects.find((p) => p.id === 10);
  if (project6) {
    project6.escrowPlan =
      '1단계(30%): 시안·제작 계약금\n2단계(40%): 샘플 제작 및 검수\n3단계(30%): 최종 납품 및 행사 당일 지급';
  }
  if (project10) {
    project10.escrowPlan = '1단계(50%): 인쇄소 발주 및 시안 확정\n2단계(50%): 제작 완료 후 배포';
  }

  return projects;
}

module.exports = { getSeedProjects, normalizeSeedProjects, SEED_ARTISTS_BY_ID };
