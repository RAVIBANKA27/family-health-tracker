const express    = require('express');
const router     = express.Router();
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

// db comes from app.locals (set in server.js after async init)
function getDb(req) { return req.app.locals.db; }

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', (req, res) => {
  const db = getDb(req);
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const id   = uuidv4();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').run(
    id, name, email.toLowerCase(), hash
  );

  // Auto-create a "Self" family member for the owner
  const memberId  = uuidv4();
  const initials  = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  db.prepare(
    `INSERT INTO family_members (id, user_id, name, relationship, avatar_initials, color)
     VALUES (?, ?, ?, 'Self', ?, '#1e4d7a')`
  ).run(memberId, id, name, initials);

  const token = jwt.sign({ id, name, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id, name, email: email.toLowerCase() } });
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const db = getDb(req);
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authMiddleware, (req, res) => {
  const user = getDb(req).prepare(
    'SELECT id, name, email, created_at FROM users WHERE id = ?'
  ).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
