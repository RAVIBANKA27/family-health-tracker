const express    = require('express');
const router     = express.Router();
const { v4: uuidv4 } = require('uuid');
const crypto     = require('crypto');
const { authMiddleware } = require('../middleware/auth');

const getDb = req => req.app.locals.db;

// ── POST /api/shares  (create share link) ────────────────────────────────────
router.post('/', authMiddleware, (req, res) => {
  const db = getDb(req);
  const { memberId, reportIds, doctorName, doctorEmail, message, expiryDays } = req.body;
  if (!memberId || !reportIds?.length || !doctorName || !doctorEmail)
    return res.status(400).json({ error: 'memberId, reportIds, doctorName, doctorEmail are required' });

  const member = db.prepare('SELECT * FROM family_members WHERE id = ? AND user_id = ?').get(memberId, req.user.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });

  for (const rid of reportIds) {
    const r = db.prepare('SELECT id FROM reports WHERE id = ? AND user_id = ? AND member_id = ?').get(rid, req.user.id, memberId);
    if (!r) return res.status(400).json({ error: `Report ${rid} not found or does not belong to this member` });
  }

  const token     = crypto.randomBytes(32).toString('hex');
  const id        = uuidv4();
  const expiresAt = expiryDays ? new Date(Date.now() + expiryDays * 86400000).toISOString() : null;

  db.prepare(`INSERT INTO doctor_shares (id, user_id, member_id, doctor_name, doctor_email, share_token, report_ids, message, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.id, memberId, doctorName, doctorEmail, token, JSON.stringify(reportIds), message||null, expiresAt);

  const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/shared/${token}`;
  res.json({ success: true, shareUrl, token, id });
});

// ── GET /api/shares  (list my shares) ───────────────────────────────────────
router.get('/', authMiddleware, (req, res) => {
  const db = getDb(req);
  const shares = db.prepare(`
    SELECT ds.*, fm.name as member_name
    FROM doctor_shares ds
    JOIN family_members fm ON fm.id = ds.member_id
    WHERE ds.user_id = ?
    ORDER BY ds.created_at DESC
  `).all(req.user.id);
  res.json(shares);
});

// ── DELETE /api/shares/:id ───────────────────────────────────────────────────
router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDb(req);
  const share = db.prepare('SELECT * FROM doctor_shares WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!share) return res.status(404).json({ error: 'Share not found' });
  db.prepare('DELETE FROM doctor_shares WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── GET /api/shares/view/:token  (PUBLIC — no auth needed) ──────────────────
router.get('/view/:token', (req, res) => {
  const db    = req.app.locals.db;
  const share = db.prepare('SELECT * FROM doctor_shares WHERE share_token = ?').get(req.params.token);
  if (!share) return res.status(404).json({ error: 'Share link not found' });
  if (share.expires_at && new Date(share.expires_at) < new Date())
    return res.status(410).json({ error: 'This share link has expired' });

  // Mark viewed
  if (!share.viewed_at)
    db.prepare("UPDATE doctor_shares SET viewed_at = datetime('now') WHERE id = ?").run(share.id);

  const reportIds = JSON.parse(share.report_ids);
  const member    = db.prepare('SELECT id, name, gender, dob, blood_group, relationship FROM family_members WHERE id = ?').get(share.member_id);
  const user      = db.prepare('SELECT name FROM users WHERE id = ?').get(share.user_id);

  const reports = reportIds.map(rid => {
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(rid);
    if (!report) return null;
    const params = db.prepare('SELECT * FROM report_parameters WHERE report_id = ? ORDER BY category, name').all(rid);
    return { ...report, parameters: params };
  }).filter(Boolean);

  res.json({
    share: { doctor_name: share.doctor_name, message: share.message, expires_at: share.expires_at, created_at: share.created_at },
    patient: { ...member, shared_by: user?.name },
    reports
  });
});

module.exports = router;
