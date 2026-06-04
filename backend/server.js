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
    const db = await initDB();

    // Make db available to all routes via app.locals
    app.locals.db = db;

    app.use('/api/auth',    require('./routes/auth'));
    app.use('/api/members', require('./routes/members'));
    app.use('/api/reports', require('./routes/reports'));
    app.use('/api/db',      require('./routes/dbadmin'));
    app.use('/api/shares',  require('./routes/shares'));

    app.listen(PORT, () => {
      console.log(`\n🏥 Family Health Tracker API  →  http://localhost:${PORT}`);
      console.log(`📊 Health check               →  http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error('❌ Failed to initialise database:', err);
    process.exit(1);
  }
})();
