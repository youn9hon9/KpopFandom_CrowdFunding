/**
 * Antigravity Custom Skill Tool: db-checker.js
 * 
 * 에이전트가 SQLite 락 위험을 방지하고 테이블 정합성을 검증할 때 실행합니다.
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function main() {
  const dbPath = process.argv[2] || path.join(__dirname, '../../data/duckrowd.db');
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  let db;
  try {
    db = new Database(dbPath, { timeout: 2000 });
    const journalModeResult = db.prepare('PRAGMA journal_mode;').get();
    const journalMode = journalModeResult ? journalModeResult.journal_mode.toUpperCase() : 'UNKNOWN';

    const requiredTables = ['users', 'projects', 'donations', 'community_posts', 'user_favorites'];
    const tableCheckQuery = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?;");
    
    let missingTables = [];
    requiredTables.forEach(tableName => {
      const row = tableCheckQuery.get(tableName);
      if (!row) {
        missingTables.push(tableName);
      }
    });

    const report = {
      status: missingTables.length === 0 ? "completed" : "failed",
      db_report: {
        db_path: dbPath,
        journal_mode: journalMode,
        wal_enabled: journalMode === 'WAL',
        missing_tables: missingTables,
        all_tables_intact: missingTables.length === 0
      }
    };

    console.log(JSON.stringify(report, null, 2));
    process.exit(missingTables.length === 0 ? 0 : 1);
  } catch (err) {
    console.error(JSON.stringify({
      status: "error",
      error: `Database connection or validation failed: ${err.message}`
    }));
    process.exit(1);
  } finally {
    if (db) db.close();
  }
}

main();
