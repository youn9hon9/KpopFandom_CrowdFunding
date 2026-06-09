const favorites = require('./favorites');

function registerFavoritesRoutes(app, db) {
  app.get('/api/users/me/favorites', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }
    res.json({
      success: true,
      favorites: favorites.listFavorites(db, req.user.id)
    });
  });

  app.get('/api/users/me/favorites/ids', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }
    res.json({
      success: true,
      ids: favorites.listFavoriteIds(db, req.user.id)
    });
  });

  app.post('/api/users/me/favorites/:projectId', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }

    const projectId = parseInt(req.params.projectId, 10);
    const project = db.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.', code: 'PROJECT_NOT_FOUND' });
    }

    favorites.addFavorite(db, req.user.id, projectId);
    res.json({ success: true, favorited: true, projectId });
  });

  app.delete('/api/users/me/favorites/:projectId', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
    }

    const projectId = parseInt(req.params.projectId, 10);
    favorites.removeFavorite(db, req.user.id, projectId);
    res.json({ success: true, favorited: false, projectId });
  });
}

module.exports = { registerFavoritesRoutes };
