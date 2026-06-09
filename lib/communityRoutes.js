const roles = require('./roles');
const community = require('./community');
const validate = require('./validate');
const kakaoMap = require('./kakaoMap');

function parseProjectId(req) {
  return parseInt(req.params.id, 10);
}

function loadProject(db, projectId, res) {
  const project = db.getProjectById(projectId);
  if (!project) {
    res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.', code: 'PROJECT_NOT_FOUND' });
    return null;
  }
  community.ensureCommunity(project);
  return project;
}

function registerCommunityRoutes(app, db) {
  app.get('/api/projects/:id/community', (req, res) => {
    const projectId = parseProjectId(req);
    const project = loadProject(db, projectId, res);
    if (!project) return;

    const enriched = community.enrichCommunity(project.community, req.user?.id);
    const myActivity = community.collectMyActivity(project.community, req.user?.id, {
      id: project.id,
      title: project.title
    });

    res.json({
      success: true,
      community: enriched,
      myActivity,
      canManage: Boolean(
        req.user && (roles.isAdmin(req.user) || roles.isProjectHost(req.user, project))
      ),
      viewerRole: roles.getViewerRole(req.user, project)
    });
  });

  app.post('/api/projects/:id/community/notices', (req, res) => {
    const projectId = parseProjectId(req);
    const project = loadProject(db, projectId, res);
    if (!project) return;

    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }
    if (!roles.isAdmin(req.user) && !roles.isProjectHost(req.user, project)) {
      return res.status(403).json({ error: '프로젝트 총대만 공지를 등록할 수 있습니다.', code: 'FORBIDDEN' });
    }

    const { title, body, pinned } = req.body;
    const noticeValidation = validate.validateNotice(title, body);
    if (!noticeValidation.ok) {
      return res.status(400).json({ error: noticeValidation.error, code: noticeValidation.code });
    }

    const notice = {
      id: community.createId('notice'),
      title: noticeValidation.title,
      body: noticeValidation.body,
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      authorUserId: req.user.id,
      authorName: req.user.name,
      pinned: Boolean(pinned)
    };
    project.community.notices.unshift(notice);
    db.saveProject(project);

    res.json({ success: true, notice });
  });

  app.delete('/api/projects/:id/community/notices/:noticeId', (req, res) => {
    const projectId = parseProjectId(req);
    const project = loadProject(db, projectId, res);
    if (!project) return;

    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }

    const notice = project.community.notices.find((n) => n.id === req.params.noticeId);
    if (!notice) {
      return res.status(404).json({ error: '공지를 찾을 수 없습니다.', code: 'NOT_FOUND' });
    }
    if (!community.canManageContent(req.user, project, notice)) {
      return res.status(403).json({ error: '삭제 권한이 없습니다.', code: 'FORBIDDEN' });
    }

    project.community.notices = project.community.notices.filter((n) => n.id !== notice.id);
    db.saveProject(project);
    res.json({ success: true });
  });

  app.post('/api/projects/:id/community/schedules', async (req, res) => {
    const projectId = parseProjectId(req);
    const project = loadProject(db, projectId, res);
    if (!project) return;

    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }
    if (!roles.isAdmin(req.user) && !roles.isProjectHost(req.user, project)) {
      return res.status(403).json({ error: '프로젝트 총대만 일정을 등록할 수 있습니다.', code: 'FORBIDDEN' });
    }

    const { title, eventDate, eventTime, location, description } = req.body;
    if (!title?.trim() || !eventDate?.trim()) {
      return res.status(400).json({ error: '일정 제목과 날짜를 입력해 주세요.', code: 'VALIDATION_ERROR' });
    }

    const locationText = (location || '').trim();
    let mapInfo = null;
    if (locationText) {
      try {
        mapInfo = await kakaoMap.geocodeAddress(locationText);
      } catch (err) {
        console.warn('[Schedule] geocode error:', err.message);
      }
    }

    const schedule = {
      id: community.createId('sched'),
      title: title.trim(),
      eventDate: eventDate.trim(),
      eventTime: (eventTime || '').trim(),
      location: locationText,
      description: (description || '').trim(),
      mapLat: mapInfo?.lat ?? null,
      mapLng: mapInfo?.lng ?? null,
      mapPlaceName: mapInfo?.placeName ?? null,
      createdAt: new Date().toISOString(),
      authorUserId: req.user.id,
      authorName: req.user.name
    };
    project.community.schedules.push(schedule);
    db.saveProject(project);

    res.json({ success: true, schedule: community.enrichSchedule(schedule) });
  });

  app.delete('/api/projects/:id/community/schedules/:scheduleId', (req, res) => {
    const projectId = parseProjectId(req);
    const project = loadProject(db, projectId, res);
    if (!project) return;

    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }

    const schedule = project.community.schedules.find((s) => s.id === req.params.scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: '일정을 찾을 수 없습니다.', code: 'NOT_FOUND' });
    }
    if (!community.canManageContent(req.user, project, schedule)) {
      return res.status(403).json({ error: '삭제 권한이 없습니다.', code: 'FORBIDDEN' });
    }

    project.community.schedules = project.community.schedules.filter((s) => s.id !== schedule.id);
    db.saveProject(project);
    res.json({ success: true });
  });

  app.post('/api/projects/:id/community/polls', (req, res) => {
    const projectId = parseProjectId(req);
    const project = loadProject(db, projectId, res);
    if (!project) return;

    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }
    if (!roles.isAdmin(req.user) && !roles.isProjectHost(req.user, project)) {
      return res.status(403).json({ error: '프로젝트 총대만 투표를 생성할 수 있습니다.', code: 'FORBIDDEN' });
    }

    const { question, options, endsAt } = req.body;
    if (!question?.trim() || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: '질문과 선택지 2개 이상을 입력해 주세요.', code: 'VALIDATION_ERROR' });
    }

    const poll = {
      id: community.createId('poll'),
      question: question.trim(),
      options: options
        .map((o) => (typeof o === 'string' ? o : o.label))
        .filter((label) => label?.trim())
        .map((label) => ({ label: label.trim(), votes: 0 })),
      voters: {},
      createdAt: new Date().toISOString(),
      authorUserId: req.user.id,
      authorName: req.user.name,
      endsAt: endsAt || null
    };

    if (poll.options.length < 2) {
      return res.status(400).json({ error: '유효한 선택지가 2개 이상 필요합니다.', code: 'VALIDATION_ERROR' });
    }

    project.community.polls.unshift(poll);
    db.saveProject(project);
    res.json({ success: true, poll: community.enrichCommunity({ polls: [poll], notices: [], schedules: [], posts: [] }, req.user?.id).polls[0] });
  });

  app.post('/api/projects/:id/community/polls/:pollId/vote', (req, res) => {
    const projectId = parseProjectId(req);
    const project = loadProject(db, projectId, res);
    if (!project) return;

    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }

    const poll = project.community.polls.find((p) => p.id === req.params.pollId);
    if (!poll) {
      return res.status(404).json({ error: '투표를 찾을 수 없습니다.', code: 'NOT_FOUND' });
    }

    const optionIndex = parseInt(req.body.optionIndex, 10);
    if (isNaN(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ error: '올바른 선택지를 골라주세요.', code: 'VALIDATION_ERROR' });
    }

    if (poll.voters[req.user.id] !== undefined) {
      return res.status(400).json({ error: '이미 투표하셨습니다.', code: 'ALREADY_VOTED' });
    }

    poll.options[optionIndex].votes += 1;
    poll.voters[req.user.id] = optionIndex;
    db.saveProject(project);

    const enriched = community.enrichCommunity({ polls: [poll], notices: [], schedules: [], posts: [] }, req.user.id).polls[0];
    res.json({ success: true, poll: enriched });
  });

  app.delete('/api/projects/:id/community/polls/:pollId', (req, res) => {
    const projectId = parseProjectId(req);
    const project = loadProject(db, projectId, res);
    if (!project) return;

    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }

    const poll = project.community.polls.find((p) => p.id === req.params.pollId);
    if (!poll) {
      return res.status(404).json({ error: '투표를 찾을 수 없습니다.', code: 'NOT_FOUND' });
    }
    if (!community.canManageContent(req.user, project, poll)) {
      return res.status(403).json({ error: '삭제 권한이 없습니다.', code: 'FORBIDDEN' });
    }

    project.community.polls = project.community.polls.filter((p) => p.id !== poll.id);
    db.saveProject(project);
    res.json({ success: true });
  });

  app.post('/api/projects/:id/community/posts', (req, res) => {
    const projectId = parseProjectId(req);
    const project = loadProject(db, projectId, res);
    if (!project) return;

    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }

    const { title, body } = req.body;
    const bodyValidation = validate.validatePostBody(body);
    if (!bodyValidation.ok) {
      return res.status(400).json({ error: bodyValidation.error, code: bodyValidation.code });
    }
    const titleValidation = validate.validatePostTitle(title);
    if (!titleValidation.ok) {
      return res.status(400).json({ error: titleValidation.error, code: titleValidation.code });
    }

    const post = {
      id: community.createId('post'),
      title: titleValidation.value,
      body: bodyValidation.value,
      createdAt: new Date().toISOString(),
      authorUserId: req.user.id,
      authorName: req.user.name,
      likeUserIds: [],
      comments: []
    };
    project.community.posts.unshift(post);
    db.saveProject(project);

    res.json({ success: true, post: community.enrichPost(post, req.user.id) });
  });

  app.get('/api/projects/:id/community/posts/:postId', (req, res) => {
    const projectId = parseProjectId(req);
    const project = loadProject(db, projectId, res);
    if (!project) return;

    const post = community.findPost(project, req.params.postId);
    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.', code: 'POST_NOT_FOUND' });
    }

    res.json({
      success: true,
      post: community.enrichPost(post, req.user?.id)
    });
  });

  app.patch('/api/projects/:id/community/posts/:postId', (req, res) => {
    const projectId = parseProjectId(req);
    const project = loadProject(db, projectId, res);
    if (!project) return;

    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }

    const post = community.findPost(project, req.params.postId);
    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.', code: 'NOT_FOUND' });
    }
    if (!community.canManageContent(req.user, project, post)) {
      return res.status(403).json({ error: '수정 권한이 없습니다.', code: 'FORBIDDEN' });
    }

    const { title, body } = req.body;
    const bodyValidation = validate.validatePostBody(body);
    if (!bodyValidation.ok) {
      return res.status(400).json({ error: bodyValidation.error, code: bodyValidation.code });
    }
    const titleValidation = validate.validatePostTitle(title);
    if (!titleValidation.ok) {
      return res.status(400).json({ error: titleValidation.error, code: titleValidation.code });
    }

    post.title = titleValidation.value;
    post.body = bodyValidation.value;
    post.updatedAt = new Date().toISOString();
    db.saveProject(project);

    res.json({ success: true, post: community.enrichPost(post, req.user.id) });
  });

  app.delete('/api/projects/:id/community/posts/:postId', (req, res) => {
    const projectId = parseProjectId(req);
    const project = loadProject(db, projectId, res);
    if (!project) return;

    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }

    const post = community.findPost(project, req.params.postId);
    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.', code: 'NOT_FOUND' });
    }
    if (!community.canManageContent(req.user, project, post)) {
      return res.status(403).json({ error: '삭제 권한이 없습니다.', code: 'FORBIDDEN' });
    }

    project.community.posts = project.community.posts.filter((p) => p.id !== post.id);
    db.saveProject(project);
    res.json({ success: true });
  });

  app.post('/api/projects/:id/community/posts/:postId/like', (req, res) => {
    const projectId = parseProjectId(req);
    const project = loadProject(db, projectId, res);
    if (!project) return;

    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }

    const post = community.findPost(project, req.params.postId);
    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.', code: 'NOT_FOUND' });
    }

    const idx = post.likeUserIds.indexOf(req.user.id);
    if (idx === -1) {
      post.likeUserIds.push(req.user.id);
    } else {
      post.likeUserIds.splice(idx, 1);
    }
    db.saveProject(project);

    res.json({
      success: true,
      liked: post.likeUserIds.includes(req.user.id),
      likeCount: post.likeUserIds.length
    });
  });

  app.post('/api/projects/:id/community/posts/:postId/comments', (req, res) => {
    const projectId = parseProjectId(req);
    const project = loadProject(db, projectId, res);
    if (!project) return;

    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }

    const post = community.findPost(project, req.params.postId);
    if (!post) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.', code: 'NOT_FOUND' });
    }

    const { body } = req.body;
    const bodyValidation = validate.validateCommentBody(body);
    if (!bodyValidation.ok) {
      return res.status(400).json({ error: bodyValidation.error, code: bodyValidation.code });
    }

    const comment = {
      id: community.createId('comment'),
      body: bodyValidation.value,
      createdAt: new Date().toISOString(),
      authorUserId: req.user.id,
      authorName: req.user.name,
      likeUserIds: []
    };
    post.comments.push(comment);
    db.saveProject(project);

    res.json({
      success: true,
      comment: {
        id: comment.id,
        body: comment.body,
        authorUserId: comment.authorUserId,
        authorName: comment.authorName,
        createdAt: comment.createdAt,
        likeCount: 0,
        likedByMe: false
      }
    });
  });

  app.patch('/api/projects/:id/community/comments/:commentId', (req, res) => {
    const projectId = parseProjectId(req);
    const project = loadProject(db, projectId, res);
    if (!project) return;

    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }

    const found = community.findComment(project, req.params.commentId);
    if (!found) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.', code: 'NOT_FOUND' });
    }

    if (!community.canManageContent(req.user, project, found.comment)) {
      return res.status(403).json({ error: '수정 권한이 없습니다.', code: 'FORBIDDEN' });
    }

    const { body } = req.body;
    const bodyValidation = validate.validateCommentBody(body);
    if (!bodyValidation.ok) {
      return res.status(400).json({ error: bodyValidation.error, code: bodyValidation.code });
    }

    found.comment.body = bodyValidation.value;
    found.comment.updatedAt = new Date().toISOString();
    db.saveProject(project);

    res.json({
      success: true,
      comment: {
        id: found.comment.id,
        body: found.comment.body,
        authorUserId: found.comment.authorUserId,
        authorName: found.comment.authorName,
        createdAt: found.comment.createdAt,
        updatedAt: found.comment.updatedAt,
        likeCount: found.comment.likeUserIds.length,
        likedByMe: found.comment.likeUserIds.includes(req.user.id)
      }
    });
  });

  app.delete('/api/projects/:id/community/comments/:commentId', (req, res) => {
    const projectId = parseProjectId(req);
    const project = loadProject(db, projectId, res);
    if (!project) return;

    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }

    const found = community.findComment(project, req.params.commentId);
    if (!found) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.', code: 'NOT_FOUND' });
    }

    if (!community.canManageContent(req.user, project, found.comment)) {
      return res.status(403).json({ error: '삭제 권한이 없습니다.', code: 'FORBIDDEN' });
    }

    found.post.comments = found.post.comments.filter((c) => c.id !== found.comment.id);
    db.saveProject(project);
    res.json({ success: true });
  });

  app.post('/api/projects/:id/community/comments/:commentId/like', (req, res) => {
    const projectId = parseProjectId(req);
    const project = loadProject(db, projectId, res);
    if (!project) return;

    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }

    const found = community.findComment(project, req.params.commentId);
    if (!found) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.', code: 'NOT_FOUND' });
    }

    const { comment } = found;
    const idx = comment.likeUserIds.indexOf(req.user.id);
    if (idx === -1) {
      comment.likeUserIds.push(req.user.id);
    } else {
      comment.likeUserIds.splice(idx, 1);
    }
    db.saveProject(project);

    res.json({
      success: true,
      liked: comment.likeUserIds.includes(req.user.id),
      likeCount: comment.likeUserIds.length
    });
  });

  // Legacy alias (detail host panel)
  app.post('/api/projects/:id/notices', (req, res) => {
    req.params.id = req.params.id;
    const projectId = parseProjectId(req);
    const project = loadProject(db, projectId, res);
    if (!project) return;

    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }
    if (!roles.isAdmin(req.user) && !roles.isProjectHost(req.user, project)) {
      return res.status(403).json({ error: '프로젝트 총대만 공지를 등록할 수 있습니다.', code: 'FORBIDDEN' });
    }

    const { title, body } = req.body;
    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ error: '공지 제목과 내용을 입력해 주세요.', code: 'VALIDATION_ERROR' });
    }

    const notice = {
      id: community.createId('notice'),
      title: title.trim(),
      body: body.trim(),
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      authorUserId: req.user.id,
      authorName: req.user.name,
      pinned: false
    };
    project.community.notices.unshift(notice);
    db.saveProject(project);
    res.json({ success: true, notice, project: roles.toPublicProject(project, { includeHostFields: true }) });
  });

  app.get('/api/users/me/community', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }

    const posts = [];
    const comments = [];

    db.getAllProjects().forEach((project) => {
      community.ensureCommunity(project);
      const activity = community.collectMyActivity(project.community, req.user.id, {
        id: project.id,
        title: project.title
      });
      posts.push(...activity.posts);
      comments.push(...activity.comments);
    });

    posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    comments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    res.json({ success: true, posts, comments });
  });
}

module.exports = { registerCommunityRoutes };
