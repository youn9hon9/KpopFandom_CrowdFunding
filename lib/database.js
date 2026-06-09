const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { getSeedProjects, normalizeSeedProjects, SEED_ARTISTS_BY_ID } = require('./seed-data');

const DEFAULT_DB_PATH = path.join(__dirname, '..', 'data', 'duckrowd.db');

let db = null;

function rowToDonation(row) {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    amount: row.amount,
    paymentMethod: row.payment_method,
    status: row.status,
    createdAt: row.created_at
  };
}

function initDatabase(dbPath = process.env.DATABASE_PATH || DEFAULT_DB_PATH) {
  if (db) return db;

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS donations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      payment_method TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_data TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS oauth_states (
      state TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  const { count } = db.prepare('SELECT COUNT(*) AS count FROM projects').get();
  if (count === 0) {
    const projects = normalizeSeedProjects(getSeedProjects());
    const insert = db.prepare('INSERT INTO projects (id, data) VALUES (?, ?)');
    const seed = db.transaction((items) => {
      for (const project of items) {
        insert.run(project.id, JSON.stringify(project));
      }
    });
    seed(projects);
    console.log(`[DB] Seeded ${projects.length} sample projects → ${dbPath}`);
  } else {
    console.log(`[DB] Loaded existing database (${count} projects) → ${dbPath}`);
  }

  return db;
}

function scheduleCommunityBackfill(db) {
  const { backfillProjectSchedules } = require('./backfillSchedules');
  backfillProjectSchedules(db)
    .then((n) => {
      if (n > 0) console.log(`[DB] Backfilled schedules for ${n} project(s)`);
    })
    .catch((err) => console.error('[DB] Schedule backfill failed:', err.message));
}

function getDb() {
  if (!db) initDatabase();
  return db;
}

function parseProject(row) {
  if (!row) return null;
  const project = JSON.parse(row.data);
  if (!project.artist && SEED_ARTISTS_BY_ID[project.id]) {
    project.artist = SEED_ARTISTS_BY_ID[project.id];
  }
  return project;
}

function getAllProjects() {
  return getDb()
    .prepare('SELECT data FROM projects ORDER BY id')
    .all()
    .map((row) => JSON.parse(row.data));
}

function getProjectById(id) {
  const row = getDb().prepare('SELECT data FROM projects WHERE id = ?').get(id);
  return parseProject(row);
}

function saveProject(project) {
  getDb()
    .prepare('INSERT OR REPLACE INTO projects (id, data) VALUES (?, ?)')
    .run(project.id, JSON.stringify(project));
  return project;
}

function createProject(projectData) {
  const { nextId } = getDb().prepare('SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM projects').get();
  const project = { ...projectData, id: nextId };
  saveProject(project);
  return project;
}

function getFeaturedProjects() {
  return getAllProjects().filter((p) => p.featured);
}

function getPopularProjects() {
  return getAllProjects()
    .filter((p) => p.popularRank != null)
    .sort((a, b) => a.popularRank - b.popularRank);
}

function getPendingProjects() {
  return getAllProjects().filter((p) => p.status === '심사 중');
}

function getProjectsByHostUserId(userId) {
  return getAllProjects().filter((p) => p.hostUserId === userId);
}

function getAllDonations() {
  return getDb()
    .prepare('SELECT * FROM donations ORDER BY created_at DESC')
    .all()
    .map(rowToDonation);
}

function getDonationById(id) {
  const row = getDb().prepare('SELECT * FROM donations WHERE id = ?').get(id);
  return row ? rowToDonation(row) : null;
}

function getDonationsByUserId(userId) {
  return getAllDonations().filter((d) => d.userId === userId);
}

function createDonation(donation) {
  getDb()
    .prepare(
      `INSERT INTO donations (id, user_id, project_id, amount, payment_method, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      donation.id,
      donation.userId,
      donation.projectId,
      donation.amount,
      donation.paymentMethod,
      donation.status,
      donation.createdAt
    );
  return donation;
}

function updateDonation(donation) {
  getDb()
    .prepare(
      `UPDATE donations
       SET user_id = ?, project_id = ?, amount = ?, payment_method = ?, status = ?, created_at = ?
       WHERE id = ?`
    )
    .run(
      donation.userId,
      donation.projectId,
      donation.amount,
      donation.paymentMethod,
      donation.status,
      donation.createdAt,
      donation.id
    );
  return donation;
}

function deleteProject(id) {
  getDb().prepare('DELETE FROM projects WHERE id = ?').run(id);
  getDb().prepare('DELETE FROM donations WHERE project_id = ?').run(id);
}

function updateSessionUser(sessionId, user) {
  if (sessionId && user) {
    sessionStore.set(sessionId, user);
  }
}

const sessionStore = {
  get(sessionId) {
    if (!sessionId) return null;
    const row = getDb().prepare('SELECT user_data FROM sessions WHERE id = ?').get(sessionId);
    return row ? JSON.parse(row.user_data) : null;
  },

  set(sessionId, userProfile) {
    getDb()
      .prepare('INSERT OR REPLACE INTO sessions (id, user_data, created_at) VALUES (?, ?, ?)')
      .run(sessionId, JSON.stringify(userProfile), new Date().toISOString());
  },

  delete(sessionId) {
    if (!sessionId) return;
    getDb().prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  }
};

module.exports = {
  initDatabase,
  scheduleCommunityBackfill,
  getDb,
  getAllProjects,
  getProjectById,
  saveProject,
  createProject,
  deleteProject,
  getFeaturedProjects,
  getPopularProjects,
  getPendingProjects,
  getProjectsByHostUserId,
  getAllDonations,
  getDonationById,
  getDonationsByUserId,
  createDonation,
  updateDonation,
  updateSessionUser,
  sessionStore
};
