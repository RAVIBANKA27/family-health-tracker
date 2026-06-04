/**
 * One-command DB backup:  node backup.js
 * Saves a dated copy to  backend/data/backups/
 */
const fs   = require('fs');
const path = require('path');

const src     = path.join(__dirname, 'data', 'health_tracker.db');
const backDir = path.join(__dirname, 'data', 'backups');

if (!fs.existsSync(src)) {
  console.error('❌  No database at', src);
  console.error('    Start the server at least once first.');
  process.exit(1);
}
if (!fs.existsSync(backDir)) fs.mkdirSync(backDir, { recursive: true });

const now   = new Date();
const stamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
const dest  = path.join(backDir, `health_tracker_${stamp}.db`);

fs.copyFileSync(src, dest);
const kb = Math.round(fs.statSync(dest).size / 1024);
console.log(`\n✅  Backup saved → ${dest}  (${kb} KB)\n`);

// Keep newest 10 only
const all = fs.readdirSync(backDir).filter(f => f.endsWith('.db')).sort().reverse();
all.slice(10).forEach(f => { fs.unlinkSync(path.join(backDir, f)); console.log('🗑  Removed old backup:', f); });
