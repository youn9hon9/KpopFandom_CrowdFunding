require('dotenv').config();
const { getSeedProjects, normalizeSeedProjects } = require('./seed-data');
const community = require('./community');
const kakaoMap = require('./kakaoMap');

const CATEGORY_DEFAULT_LOCATIONS = {
  생일카페: '강남역 2호선',
  커피차: '홍대입구역 2호선',
  지하철광고: '신사역 7호선',
  앨범공구: '강남역 2호선',
  컵홀더: '연남동 카페거리',
  응원봉: '올림픽공원',
  전시회: '성수동 카페거리',
  기타: '잠실종합운동장'
};

function buildSeedScheduleMap() {
  const map = new Map();
  normalizeSeedProjects(getSeedProjects()).forEach((p) => {
    community.ensureCommunity(p);
    if (p.community.schedules?.length) {
      map.set(p.id, JSON.parse(JSON.stringify(p.community.schedules)));
    }
  });
  return map;
}

function defaultSchedulesForProject(project) {
  const loc = CATEGORY_DEFAULT_LOCATIONS[project.category] || '서울역';
  return [
    {
      id: community.createId('sched'),
      title: `${project.title} — 행사 일정`,
      eventDate: '2026-06-15',
      eventTime: '14:00',
      location: loc,
      description: '프로젝트 대표 일정입니다.',
      authorName: project.hostName || '총대',
      createdAt: new Date().toISOString()
    }
  ];
}

async function geocodeSchedule(schedule) {
  if (!schedule.location?.trim()) return schedule;
  if (schedule.mapLat != null && schedule.mapLng != null) return schedule;

  try {
    const info = await kakaoMap.geocodeAddress(schedule.location);
    if (info) {
      schedule.mapLat = info.lat;
      schedule.mapLng = info.lng;
      schedule.mapPlaceName = info.placeName;
    }
  } catch (err) {
    console.warn(`[Backfill] geocode skip "${schedule.location}":`, err.message);
  }
  return schedule;
}

/**
 * DB 프로젝트에 schedules가 비어 있으면 시드(또는 카테고리 기본) 일정을 채웁니다.
 * @returns {Promise<number>} 업데이트된 프로젝트 수
 */
async function backfillProjectSchedules(db, { force = false } = {}) {
  const seedMap = buildSeedScheduleMap();
  const projects = db.getAllProjects();
  let updated = 0;

  for (const project of projects) {
    community.ensureCommunity(project);
    const hasSchedules = project.community.schedules.length > 0;

    if (hasSchedules && !force) continue;

    const seedSchedules = seedMap.get(project.id);
    const toAdd = seedSchedules?.length
      ? JSON.parse(JSON.stringify(seedSchedules))
      : defaultSchedulesForProject(project);

    if (hasSchedules && force) {
      project.community.schedules = [];
    }

    for (const sched of toAdd) {
      community.normalizeSchedule(sched);
      await geocodeSchedule(sched);
      project.community.schedules.push(sched);
    }

    db.saveProject(project);
    updated += 1;
    console.log(
      `[Backfill] project #${project.id} "${project.title}" → ${project.community.schedules.length} schedule(s)`
    );
  }

  return updated;
}

module.exports = { backfillProjectSchedules, buildSeedScheduleMap };
