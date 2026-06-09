function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function applySort(list, sort) {
  const copy = [...list];
  switch (sort) {
    case 'newest':
      return copy.sort((a, b) => {
        const aTime = a.submittedAt || '';
        const bTime = b.submittedAt || '';
        if (aTime && bTime) return bTime.localeCompare(aTime);
        return b.id - a.id;
      });
    case 'oldest':
      return copy.sort((a, b) => {
        const aTime = a.submittedAt || '';
        const bTime = b.submittedAt || '';
        if (aTime && bTime) return aTime.localeCompare(bTime);
        return a.id - b.id;
      });
    case 'title_asc':
      return copy.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
    case 'title_desc':
      return copy.sort((a, b) => b.title.localeCompare(a.title, 'ko'));
    case 'popular':
      return copy.sort((a, b) => {
        if (a.popularRank != null && b.popularRank != null) return a.popularRank - b.popularRank;
        if (a.popularRank != null) return -1;
        if (b.popularRank != null) return 1;
        return b.percentFunded - a.percentFunded;
      });
    case 'closing':
      return copy.sort((a, b) => a.daysLeft - b.daysLeft);
    default:
      return copy;
  }
}

function paginate(list, limit, offset) {
  const total = list.length;
  const items = list.slice(offset, offset + limit);
  return {
    items,
    total,
    limit,
    offset,
    hasMore: offset + items.length < total
  };
}

function listProjects(projects, options = {}) {
  const { q = '', category = '', artist = '', filter = 'featured', sort = '' } = options;
  let list = [...projects];
  const effectiveFilter = q.trim() && filter === 'featured' ? 'all' : filter;

  if (category) {
    list = list.filter((p) => p.category === category);
  }

  if (artist) {
    list = list.filter((p) => p.artist === artist);
  }

  if (q.trim()) {
    const term = q.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.hostName.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.artist && p.artist.toLowerCase().includes(term)) ||
        stripHtml(p.story).toLowerCase().includes(term)
    );
  }

  switch (effectiveFilter) {
    case 'featured':
      list = list.filter((p) => p.featured);
      break;
    case 'ongoing':
      list = list.filter((p) => p.status === '펀딩 진행 중');
      break;
    case 'popular':
      list = list
        .filter((p) => p.status === '펀딩 진행 중' || p.popularRank != null)
        .sort((a, b) => {
          if (a.popularRank != null && b.popularRank != null) return a.popularRank - b.popularRank;
          if (a.popularRank != null) return -1;
          if (b.popularRank != null) return 1;
          return b.percentFunded - a.percentFunded;
        });
      break;
    case 'new':
      list = list.sort((a, b) => {
        const aTime = a.submittedAt || '';
        const bTime = b.submittedAt || '';
        if (aTime && bTime) return bTime.localeCompare(aTime);
        return b.id - a.id;
      });
      break;
    case 'upcoming':
      list = list.filter((p) => p.status === '심사 중');
      break;
    case 'closing':
      list = list
        .filter((p) => p.status === '펀딩 진행 중')
        .sort((a, b) => a.daysLeft - b.daysLeft);
      break;
    case 'all':
      list = list.filter((p) => p.status !== '심사 거절');
      break;
    default:
      break;
  }

  if (sort) {
    list = applySort(list, sort);
  }

  return list;
}

function toListCard(project) {
  return {
    id: project.id,
    title: project.title,
    category: project.category,
    artist: project.artist || null,
    hostName: project.hostName,
    trustTemperature: project.trustTemperature,
    status: project.status,
    goalAmount: project.goalAmount,
    currentAmount: project.currentAmount,
    percentFunded: project.percentFunded,
    daysLeft: project.daysLeft,
    gradient: project.gradient,
    emoji: project.emoji,
    coverImage: project.coverImage || null,
    featured: project.featured,
    popularRank: project.popularRank
  };
}

const FILTER_LABELS = {
  featured: '주목할 만한 프로젝트',
  all: '전체 프로젝트',
  ongoing: '상시 판매 · 펀딩 진행 중',
  popular: '인기 프로젝트',
  new: '신규 프로젝트',
  upcoming: '공개 예정 · 심사 중',
  closing: '마감 임박'
};

const SORT_LABELS = {
  newest: '최신순',
  oldest: '오래된순',
  title_asc: '가나다순',
  title_desc: '가나다 역순',
  popular: '인기순',
  closing: '마감임박순'
};

module.exports = {
  listProjects,
  toListCard,
  paginate,
  applySort,
  FILTER_LABELS,
  SORT_LABELS
};
