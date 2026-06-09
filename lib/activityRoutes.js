const activity = require('./activity');

function registerActivityRoutes(app, db) {
  app.get('/api/users/me/activity', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }

    const type = req.query.type || 'all';
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, activity.MAX_PER_TYPE);

    const searches = type === 'all' || type === 'search' ? activity.listActivity(db, req.user.id, 'search', limit) : [];
    const views = type === 'all' || type === 'view' ? activity.listActivity(db, req.user.id, 'view', limit) : [];

    res.json({ success: true, searches, views });
  });

  app.post('/api/users/me/activity', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }

    const { type, data } = req.body;
    if (!type || !data || typeof data !== 'object') {
      return res.status(400).json({ error: 'type과 data가 필요합니다.', code: 'VALIDATION_ERROR' });
    }

    if (type === 'search') {
      const q = String(data.q || '').trim();
      if (!q) {
        return res.status(400).json({ error: '검색어가 비어 있습니다.', code: 'VALIDATION_ERROR' });
      }
      activity.recordActivity(db, req.user.id, 'search', { q });
    } else if (type === 'view') {
      const projectId = parseInt(data.projectId, 10);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: 'projectId가 필요합니다.', code: 'VALIDATION_ERROR' });
      }
      activity.recordActivity(db, req.user.id, 'view', {
        projectId,
        title: String(data.title || '').trim()
      });
    } else {
      return res.status(400).json({ error: '지원하지 않는 activity type입니다.', code: 'VALIDATION_ERROR' });
    }

    res.json({ success: true });
  });
}

module.exports = { registerActivityRoutes };
