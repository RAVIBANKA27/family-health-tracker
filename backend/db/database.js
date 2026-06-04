/**
 * database.js
 * Uses sql.js — pure JavaScript SQLite, zero native compilation needed.
 * Works on Node 18, 20, 22, 24 without Visual Studio or build tools.
 *
 * The DB is loaded from disk on startup and saved back to disk after
 * every write operation via the db.save() helper defined below.
 */

const path = require('path');
const fs   = require('fs');
const initSqlJs = require('sql.js');

const DB_PATH  = path.join(__dirname, '..', 'data', 'health_tracker.db');
const DATA_DIR = path.dirname(DB_PATH);

// ── Ensure data directory exists ─────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── We need a synchronous-looking module but sql.js init is async.
//    We export a promise that resolves to the db wrapper, then in server.js
//    we await it before starting the HTTP server.
// ─────────────────────────────────────────────────────────────────────────────

let _db = null;   // sql.js Database instance
let _SQL = null;  // sql.js module

// ── Thin wrapper that mimics the better-sqlite3 API used throughout the app ──
class DB {
  constructor(sqlJs, sqliteDb) {
    this._sql = sqlJs;
    this._db  = sqliteDb;
  }

  // Execute a raw SQL string (DDL, multi-statement) — no return value
  exec(sql) {
    this._db.exec(sql);   // sql.js has its own exec() for multi-statement DDL
    this.save();
  }

  // pragma() — only the two we use: journal_mode and foreign_keys
  pragma(str) {
    this._db.run(`PRAGMA ${str}`);
  }

  // prepare(sql) → statement object with .get(), .all(), .run()
  prepare(sql) {
    const self = this;
    return {
      get(...params) {
        const flat = params.flat();
        const stmt = self._db.prepare(sql);
        try {
          if (flat.length > 0) stmt.bind(flat);
          if (!stmt.step()) return undefined;
          const row = stmt.getAsObject();
          // sql.js getAsObject() can return empty {} — treat as undefined
          return Object.keys(row).length === 0 ? undefined : row;
        } finally {
          stmt.free();
        }
      },
      all(...params) {
        const flat    = params.flat();
        const stmt    = self._db.prepare(sql);
        const results = [];
        try {
          if (flat.length > 0) stmt.bind(flat);
          while (stmt.step()) {
            const row = stmt.getAsObject();
            results.push(row);
          }
        } finally {
          stmt.free();
        }
        return results;
      },
      run(...params) {
        const flat = params.flat();
        self._db.run(sql, flat.length > 0 ? flat : undefined);
        self.save();
        return { changes: self._db.getRowsModified() };
      }
    };
  }

  // transaction(fn) → wrapped fn that wraps in BEGIN/COMMIT and saves once
  transaction(fn) {
    const self = this;
    return function(...args) {
      self._db.run('BEGIN');
      try {
        // Temporarily suppress per-statement saves inside a transaction
        const origSave = self.save.bind(self);
        self.save = () => {};          // no-op during transaction
        fn(...args);
        self.save = origSave;          // restore
        self._db.run('COMMIT');
        origSave();                    // single save after commit
      } catch(e) {
        self._db.run('ROLLBACK');
        throw e;
      }
    };
  }

  // Persist in-memory DB to disk
  save() {
    const data = this._db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }

  get DB_PATH() { return DB_PATH; }
}

// ── DDL: all tables ───────────────────────────────────────────────────────────
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS family_members (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    name            TEXT NOT NULL,
    gender          TEXT,
    dob             TEXT,
    blood_group     TEXT,
    relationship    TEXT NOT NULL,
    avatar_initials TEXT,
    color           TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id           TEXT PRIMARY KEY,
    member_id    TEXT NOT NULL,
    user_id      TEXT NOT NULL,
    label        TEXT NOT NULL,
    year         TEXT NOT NULL,
    month        TEXT NOT NULL,
    lab_name     TEXT,
    doctor_name  TEXT,
    notes        TEXT,
    file_path    TEXT,
    file_name    TEXT,
    file_size    INTEGER,
    extracted_at TEXT,
    created_at   TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (member_id) REFERENCES family_members(id),
    FOREIGN KEY (user_id)   REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS report_parameters (
    id               TEXT PRIMARY KEY,
    report_id        TEXT NOT NULL,
    name             TEXT NOT NULL,
    category         TEXT NOT NULL,
    value            REAL,
    unit             TEXT,
    norm_min         REAL,
    norm_max         REAL,
    is_higher_better INTEGER DEFAULT 0,
    status           TEXT,
    created_at       TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (report_id) REFERENCES reports(id)
  );

  CREATE TABLE IF NOT EXISTS doctor_shares (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL,
    member_id    TEXT NOT NULL,
    doctor_name  TEXT NOT NULL,
    doctor_email TEXT NOT NULL,
    share_token  TEXT UNIQUE NOT NULL,
    report_ids   TEXT NOT NULL,
    message      TEXT,
    expires_at   TEXT,
    viewed_at    TEXT,
    created_at   TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id)   REFERENCES users(id),
    FOREIGN KEY (member_id) REFERENCES family_members(id)
  );
`;

// ── Print startup table summary ───────────────────────────────────────────────
function printStatus(db) {
  const tables = ['users','family_members','reports','report_parameters','doctor_shares'];
  console.log('\n📦 Database:', DB_PATH);
  console.log('┌─────────────────────────┬────────┐');
  console.log('│ Table                   │  Rows  │');
  console.log('├─────────────────────────┼────────┤');
  for (const t of tables) {
    try {
      const row = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get();
      const c   = row ? row.c : 0;
      console.log(`│ ${t.padEnd(23)} │ ${String(c).padStart(6)} │`);
    } catch(e) {
      console.log(`│ ${t.padEnd(23)} │  ERROR │`);
    }
  }
  console.log('└─────────────────────────┴────────┘');
  try {
    const kb = Math.round(fs.statSync(DB_PATH).size / 1024);
    console.log(`   DB size: ${kb} KB\n`);
  } catch(e) { console.log(''); }
}

// ── Async initialiser — called once in server.js ─────────────────────────────
async function initDB() {
  if (_db) return _db;

  const SQL = await initSqlJs();
  _SQL = SQL;

  let sqliteDb;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    sqliteDb = new SQL.Database(fileBuffer);
  } else {
    sqliteDb = new SQL.Database();
  }

  _db = new DB(SQL, sqliteDb);
  sqliteDb.run('PRAGMA foreign_keys = ON');
  sqliteDb.exec(SCHEMA);
  _db.save();   // persist schema immediately

  printStatus(_db);
  return _db;
}

module.exports = { initDB, DB_PATH };
