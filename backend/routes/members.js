const express    = require('express');
const router     = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
const getDb = req => req.app.locals.db;

const COLORS = ['#1e4d7a','#0f6b52','#7c3aed','#b91c1c','#d97706','#0891b2','#be185d','#065f46'];

// GET /api/members
router.get('/', (req, res) => {
  const db = getDb(req);
  const members = db.prepare(`
    SELECT fm.*,
      (SELECT COUNT(*) FROM reports r WHERE r.member_id = fm.id) as report_count,
      (SELECT MAX(r.created_at) FROM reports r WHERE r.member_id = fm.id) as last_report_date
    FROM family_members fm
    WHERE fm.user_id = ?
    ORDER BY fm.created_at ASC
  `).all(req.user.id);
  res.json(members);
});

// POST /api/members
router.post('/', (req, res) => {
  const db = getDb(req);
  const { name, gender, dob, blood_group, relationship } = req.body;
  if (!name || !relationship)
    return res.status(400).json({ error: 'Name and relationship are required' });

  const id       = uuidv4();
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const count    = db.prepare('SELECT COUNT(*) as c FROM family_members WHERE user_id = ?').get(req.user.id);
  const color    = COLORS[(count ? count.c : 0) % COLORS.length];

  db.prepare(
    `INSERT INTO family_members (id, user_id, name, gender, dob, blood_group, relationship, avatar_initials, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.id, name, gender || null, dob || null, blood_group || null, relationship, initials, color);

  res.json(db.prepare('SELECT * FROM family_members WHERE id = ?').get(id));
});

// PUT /api/members/:id
router.put('/:id', (req, res) => {
  const db     = getDb(req);
  const member = db.prepare('SELECT * FROM family_members WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });

  const { name, gender, dob, blood_group, relationship } = req.body;
  const newName    = name         || member.name;
  const initials   = newName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  db.prepare(
    `UPDATE family_members SET name=?, gender=?, dob=?, blood_group=?, relationship=?, avatar_initials=? WHERE id=?`
  ).run(newName, gender || member.gender, dob || member.dob,
        blood_group || member.blood_group, relationship || member.relationship, initials, req.params.id);

  res.json(db.prepare('SELECT * FROM family_members WHERE id = ?').get(req.params.id));
});

// DELETE /api/members/:id
router.delete('/:id', (req, res) => {
  const db = getDb(req);
  const member = db.prepare('SELECT * FROM family_members WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });

  // Manually delete cascade (sql.js foreign key cascade can be tricky)
  const reports = db.prepare('SELECT id FROM reports WHERE member_id = ?').all(req.params.id);
  for (const r of reports) {
    db.prepare('DELETE FROM report_parameters WHERE report_id = ?').run(r.id);
  }
  db.prepare('DELETE FROM reports WHERE member_id = ?').run(req.params.id);
  db.prepare('DELETE FROM doctor_shares WHERE member_id = ?').run(req.params.id);
  db.prepare('DELETE FROM family_members WHERE id = ?').run(req.params.id);

  res.json({ success: true });
});

module.exports = router;
