const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const { DB_PATH } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
const getDb = req => req.app.locals.db;

// GET /api/db/summary
router.get('/summary', (req, res) => {
  const db     = getDb(req);
  const tables = ['users','family_members','reports','report_parameters','doctor_shares'];
  const summary = {};
  for (const t of tables) {
    const row = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get();
    summary[t] = row ? row.c : 0;
  }
  let sizeKB = 0;
  try { sizeKB = Math.round(fs.statSync(DB_PATH).size / 1024); } catch(e){}
  res.json({ tables: summary, size_kb: sizeKB, db_path: DB_PATH });
});

// GET /api/db/table/:name
router.get('/table/:name', (req, res) => {
  const db      = getDb(req);
  const allowed = ['family_members','reports','report_parameters','doctor_shares'];
  if (!allowed.includes(req.params.name)) return res.status(400).json({ error: 'Table not accessible' });

  let rows;
  if (req.params.name === 'report_parameters') {
    rows = db.prepare(`
      SELECT rp.* FROM report_parameters rp
      JOIN reports r ON r.id = rp.report_id
      WHERE r.user_id = ?
      ORDER BY rp.created_at DESC
    `).all(req.user.id);
  } else {
    rows = db.prepare(`SELECT * FROM ${req.params.name} WHERE user_id = ? ORDER BY created_at DESC`).all(req.user.id);
  }
  res.json(rows);
});

// GET /api/db/export  (full JSON)
router.get('/export', (req, res) => {
  const db  = getDb(req);
  const uid = req.user.id;

  const members    = db.prepare('SELECT * FROM family_members WHERE user_id = ?').all(uid);
  const reports    = db.prepare('SELECT * FROM reports WHERE user_id = ?').all(uid);
  const rids       = reports.map(r => r.id);
  let   parameters = [];
  if (rids.length > 0) {
    const ph = rids.map(() => '?').join(',');
    parameters = db.prepare(`SELECT * FROM report_parameters WHERE report_id IN (${ph})`).all(...rids);
  }
  const shares = db.prepare('SELECT id, doctor_name, doctor_email, member_id, report_ids, expires_at, created_at FROM doctor_shares WHERE user_id = ?').all(uid);
  const user   = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(uid);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="healthtracker_backup_${new Date().toISOString().slice(0,10)}.json"`);
  res.json({ exported_at: new Date().toISOString(), user, family_members: members, reports, report_parameters: parameters, doctor_shares: shares });
});

// GET /api/db/export/csv/:table
router.get('/export/csv/:table', (req, res) => {
  const db      = getDb(req);
  const allowed = ['reports','report_parameters','family_members'];
  if (!allowed.includes(req.params.table)) return res.status(400).json({ error: 'Not exportable' });

  let rows;
  if (req.params.table === 'report_parameters') {
    rows = db.prepare(`
      SELECT rp.*, r.label as report_label, fm.name as member_name
      FROM report_parameters rp
      JOIN reports r ON r.id = rp.report_id
      JOIN family_members fm ON fm.id = r.member_id
      WHERE r.user_id = ? ORDER BY fm.name, r.year, r.month, rp.name
    `).all(req.user.id);
  } else if (req.params.table === 'reports') {
    rows = db.prepare(`
      SELECT r.*, fm.name as member_name FROM reports r
      JOIN family_members fm ON fm.id = r.member_id
      WHERE r.user_id = ? ORDER BY fm.name, r.year, r.month
    `).all(req.user.id);
  } else {
    rows = db.prepare(`SELECT * FROM ${req.params.table} WHERE user_id = ? ORDER BY created_at`).all(req.user.id);
  }

  if (!rows.length) return res.status(404).json({ error: 'No data found' });

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(row => headers.map(h => {
      const v = row[h] == null ? '' : String(row[h]);
      return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g,'""')}"` : v;
    }).join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.table}_${new Date().toISOString().slice(0,10)}.csv"`);
  res.send(csv);
});

module.exports = router;
