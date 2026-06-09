const crypto = require('crypto');

function createId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function emptyCommunity() {
  return { notices: [], schedules: [], polls: [], posts: [] };
}

function ensureCommunity(project) {
  if (!project.community) {
    project.community = emptyCommunity();
    return project.community;
  }
  const c = project.community;
  if (!Array.isArray(c.notices)) c.notices = [];
  if (!Array.isArray(c.schedules)) c.schedules = [];
  if (!Array.isArray(c.polls)) c.polls = [];
  if (!Array.isArray(c.posts)) c.posts = [];

  c.notices.forEach((n) => normalizeNotice(n));
  c.polls.forEach((p) => normalizePoll(p));
  c.posts.forEach((p) => normalizePost(p));
  c.schedules.forEach((s) => normalizeSchedule(s));

  return c;
}

function normalizeNotice(notice) {
  if (!notice.id) notice.id = createId('notice');
  if (!notice.createdAt) notice.createdAt = notice.date ? `${notice.date}T00:00:00.000Z` : new Date().toISOString();
  if (!notice.date) notice.date = notice.createdAt.slice(0, 10);
  if (!notice.authorUserId) notice.authorUserId = null;
  if (!notice.authorName) notice.authorName = '총대';
  if (notice.pinned === undefined) notice.pinned = false;
}

function normalizeSchedule(schedule) {
  if (!schedule.id) schedule.id = createId('sched');
  if (!schedule.createdAt) schedule.createdAt = new Date().toISOString();
  if (!schedule.authorUserId) schedule.authorUserId = null;
  if (!schedule.authorName) schedule.authorName = '총대';
}

function normalizePoll(poll) {
  if (!poll.id) poll.id = createId('poll');
  if (!poll.createdAt) poll.createdAt = new Date().toISOString();
  if (!poll.authorUserId) poll.authorUserId = null;
  if (!poll.authorName) poll.authorName = '총대';
  if (!Array.isArray(poll.options)) poll.options = [];
  poll.options.forEach((opt) => {
    if (typeof opt.votes !== 'number') opt.votes = 0;
  });
  if (!poll.voters || typeof poll.voters !== 'object') poll.voters = {};
}

function normalizePost(post) {
  if (!post.id) post.id = createId('post');
  if (!post.createdAt) post.createdAt = new Date().toISOString();
  if (!post.authorUserId) post.authorUserId = null;
  if (!post.authorName) post.authorName = '익명';
  if (!Array.isArray(post.likeUserIds)) post.likeUserIds = [];
  if (!Array.isArray(post.comments)) post.comments = [];
  post.comments.forEach((c) => normalizeComment(c));
}

function normalizeComment(comment) {
  if (!comment.id) comment.id = createId('comment');
  if (!comment.createdAt) comment.createdAt = new Date().toISOString();
  if (!comment.authorUserId) comment.authorUserId = null;
  if (!comment.authorName) comment.authorName = '익명';
  if (!Array.isArray(comment.likeUserIds)) comment.likeUserIds = [];
}

const kakaoMap = require('./kakaoMap');

function enrichSchedule(schedule) {
  const label = schedule.mapPlaceName || schedule.location || schedule.title;
  return {
    ...schedule,
    mapUrl: kakaoMap.buildMapLinkUrl(schedule.mapLat, schedule.mapLng, label),
    hasMapCoords: schedule.mapLat != null && schedule.mapLng != null
  };
}

function canManageContent(user, project, item) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (project.hostUserId && project.hostUserId === user.id) return true;
  if (item?.authorUserId && item.authorUserId === user.id) return true;
  return false;
}

function enrichCommunity(community, userId) {
  const uid = userId || null;

  return {
    notices: community.notices.map((n) => ({
      ...n,
      likedByMe: false
    })),
    schedules: [...community.schedules]
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
      .map(enrichSchedule),
    polls: community.polls.map((poll) => {
      const myVote = uid && poll.voters[uid] !== undefined ? poll.voters[uid] : null;
      const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
      return {
        id: poll.id,
        question: poll.question,
        options: poll.options.map((opt, idx) => ({
          label: opt.label,
          votes: opt.votes,
          percent: totalVotes ? Math.round((opt.votes / totalVotes) * 100) : 0
        })),
        totalVotes,
        myVote,
        hasVoted: myVote !== null,
        authorName: poll.authorName,
        createdAt: poll.createdAt,
        endsAt: poll.endsAt || null
      };
    }),
    posts: community.posts.map((post) => enrichPost(post, uid))
  };
}

function enrichPost(post, userId) {
  return {
    id: post.id,
    title: post.title || '',
    body: post.body,
    authorUserId: post.authorUserId,
    authorName: post.authorName,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt || null,
    likeCount: post.likeUserIds.length,
    likedByMe: userId ? post.likeUserIds.includes(userId) : false,
    comments: post.comments.map((c) => ({
      id: c.id,
      body: c.body,
      authorUserId: c.authorUserId,
      authorName: c.authorName,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt || null,
      likeCount: c.likeUserIds.length,
      likedByMe: userId ? c.likeUserIds.includes(userId) : false
    }))
  };
}

function collectMyActivity(community, userId, projectMeta) {
  if (!userId) return { posts: [], comments: [] };

  const myPosts = community.posts
    .filter((p) => p.authorUserId === userId)
    .map((p) => ({
      type: 'post',
      id: p.id,
      projectId: projectMeta.id,
      projectTitle: projectMeta.title,
      title: p.title || '',
      body: p.body,
      createdAt: p.createdAt,
      likeCount: p.likeUserIds.length
    }));

  const myComments = [];
  community.posts.forEach((post) => {
    post.comments.forEach((c) => {
      if (c.authorUserId === userId) {
        myComments.push({
          type: 'comment',
          id: c.id,
          postId: post.id,
          projectId: projectMeta.id,
          projectTitle: projectMeta.title,
          postTitle: post.title || post.body.slice(0, 40),
          body: c.body,
          createdAt: c.createdAt,
          likeCount: c.likeUserIds.length
        });
      }
    });
  });

  return {
    posts: myPosts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    comments: myComments.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  };
}

function findPost(project, postId) {
  const community = ensureCommunity(project);
  return community.posts.find((p) => p.id === postId) || null;
}

function findComment(project, commentId) {
  const community = ensureCommunity(project);
  for (const post of community.posts) {
    const comment = post.comments.find((c) => c.id === commentId);
    if (comment) return { post, comment };
  }
  return null;
}

module.exports = {
  createId,
  emptyCommunity,
  ensureCommunity,
  canManageContent,
  enrichCommunity,
  enrichPost,
  enrichSchedule,
  collectMyActivity,
  findPost,
  findComment,
  normalizeNotice,
  normalizePoll,
  normalizePost,
  normalizeSchedule
};
