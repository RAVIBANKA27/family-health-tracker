require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const { initDB } = require('./db/database');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Init DB first, then register routes and start listening ──────────────────
(async () => {
  try {
    console.log("STEP 1 - Starting app");

    const db = await initDB();
    console.log("STEP 2 - DB initialized");

    app.locals.db = db;

    console.log("Loading auth routes...");
    app.use('/api/auth', require('./routes/auth'));

    console.log("Loading members routes...");
    app.use('/api/members', require('./routes/members'));

    console.log("Loading reports routes...");
    app.use('/api/reports', require('./routes/reports'));

    console.log("Loading dbadmin routes...");
    app.use('/api/db', require('./routes/dbadmin'));

    console.log("Loading shares routes...");
    app.use('/api/shares', require('./routes/shares'));

    console.log("STEP 3 - All routes loaded");

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`STEP 4 - Server listening on ${PORT}`);
    });

  } catch (err) {
    console.error("STARTUP ERROR:", err);
    process.exit(1);
  }
})();
