const STATE_TTL_MS = 10 * 60 * 1000;

function purgeExpiredStates(getDb) {
  const cutoff = Date.now() - STATE_TTL_MS;
  getDb().prepare('DELETE FROM oauth_states WHERE created_at < ?').run(cutoff);
}

function saveOAuthState(getDb, state, payload) {
  purgeExpiredStates(getDb);
  getDb()
    .prepare(
      'INSERT OR REPLACE INTO oauth_states (state, provider, payload, created_at) VALUES (?, ?, ?, ?)'
    )
    .run(state, payload.provider, JSON.stringify(payload), Date.now());
}

function consumeOAuthState(getDb, state, provider) {
  purgeExpiredStates(getDb);
  const row = getDb()
    .prepare('SELECT provider, payload, created_at FROM oauth_states WHERE state = ?')
    .get(state);
  if (!row || row.provider !== provider) {
    return null;
  }
  if (Date.now() - row.created_at > STATE_TTL_MS) {
    getDb().prepare('DELETE FROM oauth_states WHERE state = ?').run(state);
    return null;
  }
  getDb().prepare('DELETE FROM oauth_states WHERE state = ?').run(state);
  return JSON.parse(row.payload);
}

module.exports = { saveOAuthState, consumeOAuthState, STATE_TTL_MS };
