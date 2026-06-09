const MAX_PER_TYPE = 20;

function ensureActivityTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_user_activity_user_type
      ON user_activity(user_id, type, created_at DESC);
  `);
}

function recordActivity(db, userId, type, payload) {
  ensureActivityTable(db.getDb());
  const data = JSON.stringify(payload);
  const createdAt = new Date().toISOString();

  const dup = db
    .getDb()
    .prepare(
      `SELECT id FROM user_activity
       WHERE user_id = ? AND type = ? AND data = ?
       ORDER BY created_at DESC LIMIT 1`
    )
    .get(userId, type, data);

  if (dup) {
    db.getDb()
      .prepare('UPDATE user_activity SET created_at = ? WHERE id = ?')
      .run(createdAt, dup.id);
  } else {
    db.getDb()
      .prepare('INSERT INTO user_activity (user_id, type, data, created_at) VALUES (?, ?, ?, ?)')
      .run(userId, type, data, createdAt);
  }

  const excess = db
    .getDb()
    .prepare(
      `SELECT id FROM user_activity
       WHERE user_id = ? AND type = ?
       ORDER BY created_at DESC
       LIMIT -1 OFFSET ?`
    )
    .all(userId, type, MAX_PER_TYPE);

  if (excess.length) {
    const ids = excess.map((r) => r.id);
    db.getDb()
      .prepare(`DELETE FROM user_activity WHERE id IN (${ids.map(() => '?').join(',')})`)
      .run(...ids);
  }
}

function listActivity(db, userId, type, limit = 10) {
  ensureActivityTable(db.getDb());
  const rows = db
    .getDb()
    .prepare(
      `SELECT data, created_at FROM user_activity
       WHERE user_id = ? AND type = ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(userId, type, limit);

  return rows.map((row) => ({
    ...JSON.parse(row.data),
    createdAt: row.created_at
  }));
}

module.exports = { recordActivity, listActivity, MAX_PER_TYPE };
