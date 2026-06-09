const projectList = require('./projectList');

function ensureFavoritesTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_favorites (
      user_id TEXT NOT NULL,
      project_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, project_id)
    );
    CREATE INDEX IF NOT EXISTS idx_user_favorites_user
      ON user_favorites(user_id, created_at DESC);
  `);
}

function addFavorite(db, userId, projectId) {
  ensureFavoritesTable(db.getDb());
  const createdAt = new Date().toISOString();
  db.getDb()
    .prepare(
      `INSERT INTO user_favorites (user_id, project_id, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id, project_id) DO UPDATE SET created_at = excluded.created_at`
    )
    .run(userId, projectId, createdAt);
}

function removeFavorite(db, userId, projectId) {
  ensureFavoritesTable(db.getDb());
  db.getDb()
    .prepare('DELETE FROM user_favorites WHERE user_id = ? AND project_id = ?')
    .run(userId, projectId);
}

function isFavorite(db, userId, projectId) {
  ensureFavoritesTable(db.getDb());
  const row = db
    .getDb()
    .prepare('SELECT 1 FROM user_favorites WHERE user_id = ? AND project_id = ?')
    .get(userId, projectId);
  return Boolean(row);
}

function listFavoriteIds(db, userId) {
  ensureFavoritesTable(db.getDb());
  return db
    .getDb()
    .prepare(
      `SELECT project_id FROM user_favorites
       WHERE user_id = ?
       ORDER BY created_at DESC`
    )
    .all(userId)
    .map((r) => r.project_id);
}

function listFavorites(db, userId) {
  const ids = listFavoriteIds(db, userId);
  if (!ids.length) return [];

  const byId = new Map(db.getAllProjects().map((p) => [p.id, p]));
  return ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map(projectList.toListCard);
}

module.exports = {
  addFavorite,
  removeFavorite,
  isFavorite,
  listFavoriteIds,
  listFavorites
};
