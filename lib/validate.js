const LIMITS = {
  title: 200,
  postBody: 5000,
  commentBody: 1000,
  story: 10000,
  escrowPlan: 5000,
  noticeBody: 5000,
  search: 100
};

const PROJECT_CATEGORIES = [
  '생일카페',
  '지하철광고',
  '커피차',
  '전시회',
  '컵홀더',
  '응원봉',
  '앨범공구',
  '기타',
  '광고'
];

function trimRequired(value, label) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return { ok: false, error: `${label}을(를) 입력해 주세요.`, code: 'VALIDATION_ERROR' };
  }
  return { ok: true, value: trimmed };
}

function maxLength(value, max, label) {
  if (value.length > max) {
    return { ok: false, error: `${label}은(는) ${max}자 이하여야 합니다.`, code: 'VALIDATION_ERROR' };
  }
  return { ok: true, value };
}

function positiveInt(value, label, min = 1) {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < min) {
    return {
      ok: false,
      error: `${label}은(는) ${min.toLocaleString('ko-KR')} 이상이어야 합니다.`,
      code: 'VALIDATION_ERROR'
    };
  }
  return { ok: true, value: parsed };
}

function validatePostBody(body) {
  const required = trimRequired(body, '게시글 내용');
  if (!required.ok) return required;
  return maxLength(required.value, LIMITS.postBody, '게시글 내용');
}

function validatePostTitle(title) {
  const trimmed = String(title ?? '').trim();
  if (!trimmed) return { ok: true, value: '' };
  return maxLength(trimmed, LIMITS.title, '게시글 제목');
}

function validateCommentBody(body) {
  const required = trimRequired(body, '댓글 내용');
  if (!required.ok) return required;
  return maxLength(required.value, LIMITS.commentBody, '댓글 내용');
}

function validateNotice(title, body) {
  const titleResult = trimRequired(title, '공지 제목');
  if (!titleResult.ok) return titleResult;
  const titleLen = maxLength(titleResult.value, LIMITS.title, '공지 제목');
  if (!titleLen.ok) return titleLen;

  const bodyResult = trimRequired(body, '공지 내용');
  if (!bodyResult.ok) return bodyResult;
  const bodyLen = maxLength(bodyResult.value, LIMITS.noticeBody, '공지 내용');
  if (!bodyLen.ok) return bodyLen;

  return { ok: true, title: titleLen.value, body: bodyLen.value };
}

function validateProjectCreate({ title, category, goalAmount, story, daysLeft }) {
  const titleResult = trimRequired(title, '프로젝트 제목');
  if (!titleResult.ok) return titleResult;
  const titleLen = maxLength(titleResult.value, LIMITS.title, '프로젝트 제목');
  if (!titleLen.ok) return titleLen;

  const categoryResult = trimRequired(category, '카테고리');
  if (!categoryResult.ok) return categoryResult;
  if (!PROJECT_CATEGORIES.includes(categoryResult.value)) {
    return { ok: false, error: '올바른 카테고리를 선택해 주세요.', code: 'VALIDATION_ERROR' };
  }

  const goalResult = positiveInt(goalAmount, '목표 금액', 10000);
  if (!goalResult.ok) return goalResult;

  const storyResult = trimRequired(story, '프로젝트 스토리');
  if (!storyResult.ok) return storyResult;
  const storyLen = maxLength(storyResult.value, LIMITS.story, '프로젝트 스토리');
  if (!storyLen.ok) return storyLen;

  const days = daysLeft != null && daysLeft !== '' ? parseInt(daysLeft, 10) : 30;
  if (isNaN(days) || days < 1 || days > 90) {
    return { ok: false, error: '펀딩 기간은 1~90일 사이여야 합니다.', code: 'VALIDATION_ERROR' };
  }

  return {
    ok: true,
    title: titleLen.value,
    category: categoryResult.value,
    goalAmount: goalResult.value,
    story: storyLen.value,
    daysLeft: days
  };
}

function validateSponsorAmount(amount) {
  return positiveInt(amount, '후원 금액', 1000);
}

function parsePagination(query, { defaultLimit = 12, maxLimit = 50 } = {}) {
  let limit = parseInt(query.limit, 10);
  let offset = parseInt(query.offset, 10);
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  if (isNaN(offset) || offset < 0) offset = 0;
  return { limit, offset };
}

const SORT_OPTIONS = ['newest', 'oldest', 'title_asc', 'title_desc', 'popular', 'closing'];

function normalizeSort(sort) {
  const s = String(sort || '').trim();
  return SORT_OPTIONS.includes(s) ? s : '';
}

module.exports = {
  LIMITS,
  PROJECT_CATEGORIES,
  SORT_OPTIONS,
  trimRequired,
  positiveInt,
  validatePostBody,
  validatePostTitle,
  validateCommentBody,
  validateNotice,
  validateProjectCreate,
  validateSponsorAmount,
  parsePagination,
  normalizeSort
};
