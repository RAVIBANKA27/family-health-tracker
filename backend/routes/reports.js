const express    = require('express');
const router     = express.Router();
const { v4: uuidv4 } = require('uuid');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
const getDb = req => req.app.locals.db;

// ── Multer ────────────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['.pdf','.jpg','.jpeg','.png','.webp'];
    ok.includes(path.extname(file.originalname).toLowerCase()) ? cb(null, true) : cb(new Error('Only PDF and images allowed'));
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  PARAMETER KNOWLEDGE BASE  (60+ common lab tests)
// ══════════════════════════════════════════════════════════════════════════════
const PARAM_DB = [
  // CBC
  { names:['haemoglobin','hemoglobin','hgb','hb'],                          cat:'cbc',     unit:'g/dL',     min:13,   max:17,    hib:false },
  { names:['rbc','red blood cell count','erythrocyte count'],                cat:'cbc',     unit:'mill/mm3', min:4.5,  max:5.5,   hib:false },
  { names:['haematocrit','hematocrit','pcv','packed cell volume'],           cat:'cbc',     unit:'%',        min:40,   max:50,    hib:false },
  { names:['total wbc','wbc','tlc','total leucocyte','total leukocyte'],     cat:'cbc',     unit:'thou/mm3', min:4,    max:11,    hib:false },
  { names:['platelet count','plt','thrombocyte'],                            cat:'cbc',     unit:'thou/mm3', min:150,  max:410,   hib:false },
  { names:['mpv','mean platelet volume'],                                    cat:'cbc',     unit:'fL',       min:7.4,  max:10.4,  hib:false },
  { names:['mcv','mean corpuscular volume'],                                 cat:'cbc',     unit:'fL',       min:80,   max:100,   hib:false },
  { names:['mch','mean corpuscular hemoglobin'],                             cat:'cbc',     unit:'pg',       min:27,   max:33,    hib:false },
  { names:['mchc'],                                                          cat:'cbc',     unit:'g/dL',     min:31.5, max:36,    hib:false },
  { names:['neutrophil','neutrophils'],                                      cat:'cbc',     unit:'%',        min:40,   max:70,    hib:false },
  { names:['lymphocyte','lymphocytes'],                                      cat:'cbc',     unit:'%',        min:20,   max:40,    hib:false },
  { names:['monocyte','monocytes'],                                          cat:'cbc',     unit:'%',        min:2,    max:10,    hib:false },
  { names:['eosinophil','eosinophils'],                                      cat:'cbc',     unit:'%',        min:1,    max:6,     hib:false },
  { names:['basophil','basophils'],                                          cat:'cbc',     unit:'%',        min:0,    max:1,     hib:false },
  { names:['esr','erythrocyte sedimentation rate'],                         cat:'cbc',     unit:'mm/hr',    min:0,    max:20,    hib:false },
  // SUGAR
  { names:['fasting glucose','fasting blood sugar','fbs'],                  cat:'sugar',   unit:'mg/dL',    min:70,   max:110,   hib:false },
  { names:['pp glucose','postprandial glucose','ppbs','2hr pp glucose'],    cat:'sugar',   unit:'mg/dL',    min:70,   max:140,   hib:false },
  { names:['hba1c','glycated hemoglobin','glycosylated hemoglobin'],        cat:'sugar',   unit:'%',        min:4,    max:6,     hib:false },
  { names:['random blood sugar','rbs','random glucose'],                    cat:'sugar',   unit:'mg/dL',    min:70,   max:140,   hib:false },
  { names:['insulin fasting','serum insulin'],                              cat:'sugar',   unit:'uIU/mL',   min:2.6,  max:24.9,  hib:false },
  // LIPIDS
  { names:['total cholesterol','serum cholesterol'],                        cat:'lipid',   unit:'mg/dL',    min:0,    max:200,   hib:false },
  { names:['hdl cholesterol','hdl','high density lipoprotein'],             cat:'lipid',   unit:'mg/dL',    min:40,   max:60,    hib:true  },
  { names:['ldl cholesterol','ldl','low density lipoprotein'],              cat:'lipid',   unit:'mg/dL',    min:0,    max:130,   hib:false },
  { names:['triglycerides','triglyceride','serum triglycerides'],           cat:'lipid',   unit:'mg/dL',    min:0,    max:150,   hib:false },
  { names:['vldl cholesterol','vldl'],                                      cat:'lipid',   unit:'mg/dL',    min:0,    max:30,    hib:false },
  { names:['non-hdl cholesterol','non hdl'],                                cat:'lipid',   unit:'mg/dL',    min:0,    max:160,   hib:false },
  // LIVER
  { names:['total bilirubin','bilirubin total'],                            cat:'liver',   unit:'mg/dL',    min:0.3,  max:1.2,   hib:false },
  { names:['direct bilirubin','bilirubin direct'],                          cat:'liver',   unit:'mg/dL',    min:0,    max:0.3,   hib:false },
  { names:['indirect bilirubin','bilirubin indirect'],                      cat:'liver',   unit:'mg/dL',    min:0.1,  max:1.0,   hib:false },
  { names:['sgot','ast','aspartate aminotransferase'],                      cat:'liver',   unit:'U/L',      min:5,    max:40,    hib:false },
  { names:['sgpt','alt','alanine aminotransferase'],                        cat:'liver',   unit:'U/L',      min:5,    max:40,    hib:false },
  { names:['alkaline phosphatase','alp'],                                   cat:'liver',   unit:'U/L',      min:30,   max:120,   hib:false },
  { names:['gamma gt','ggt','gamma glutamyl transferase'],                  cat:'liver',   unit:'U/L',      min:0,    max:55,    hib:false },
  { names:['total protein','serum total protein'],                          cat:'liver',   unit:'g/dL',     min:6,    max:8.3,   hib:false },
  { names:['serum albumin','albumin'],                                      cat:'liver',   unit:'g/dL',     min:3.4,  max:5.4,   hib:false },
  { names:['serum globulin','globulin'],                                    cat:'liver',   unit:'g/dL',     min:2,    max:3.5,   hib:false },
  // KIDNEY
  { names:['serum creatinine','creatinine'],                                cat:'kidney',  unit:'mg/dL',    min:0.67, max:1.2,   hib:false },
  { names:['blood urea','serum urea','urea nitrogen','bun'],                cat:'kidney',  unit:'mg/dL',    min:17,   max:43,    hib:false },
  { names:['serum uric acid','uric acid'],                                  cat:'kidney',  unit:'mg/dL',    min:3.5,  max:7.2,   hib:false },
  { names:['egfr','estimated gfr','glomerular filtration rate'],            cat:'kidney',  unit:'mL/min',   min:60,   max:120,   hib:true  },
  { names:['serum sodium','sodium'],                                        cat:'kidney',  unit:'mmol/L',   min:136,  max:146,   hib:false },
  { names:['serum potassium','potassium'],                                  cat:'kidney',  unit:'mmol/L',   min:3.5,  max:5.0,   hib:false },
  { names:['serum chloride','chloride'],                                    cat:'kidney',  unit:'mmol/L',   min:98,   max:107,   hib:false },
  { names:['serum calcium','calcium'],                                      cat:'kidney',  unit:'mg/dL',    min:8.6,  max:10.3,  hib:false },
  { names:['serum phosphorus','phosphorus','phosphate'],                    cat:'kidney',  unit:'mg/dL',    min:2.5,  max:4.5,   hib:false },
  // THYROID
  { names:['tsh','thyroid stimulating hormone'],                            cat:'thyroid', unit:'uIU/mL',   min:0.35, max:4.94,  hib:false },
  { names:['free t4','ft4','free thyroxine'],                               cat:'thyroid', unit:'ng/dL',    min:0.56, max:1.5,   hib:false },
  { names:['free t3','ft3','free triiodothyronine'],                        cat:'thyroid', unit:'pg/mL',    min:1.71, max:3.71,  hib:false },
  { names:['total t4','t4 total','thyroxine total'],                        cat:'thyroid', unit:'ug/dL',    min:5.1,  max:14.1,  hib:false },
  { names:['total t3','t3 total','triiodothyronine total'],                 cat:'thyroid', unit:'ng/dL',    min:80,   max:200,   hib:false },
  // VITAMINS
  { names:['vitamin d','25-oh vitamin d','25 oh vitamin d','calcidiol'],   cat:'vitamin', unit:'ng/mL',    min:30,   max:100,   hib:true  },
  { names:['vitamin b12','vit b12','cyanocobalamin','cobalamin'],           cat:'vitamin', unit:'pg/mL',    min:200,  max:914,   hib:true  },
  { names:['folic acid','folate','vitamin b9'],                             cat:'vitamin', unit:'ng/mL',    min:3,    max:20,    hib:true  },
  { names:['serum iron','iron','fe serum'],                                 cat:'vitamin', unit:'ug/dL',    min:65,   max:175,   hib:true  },
  { names:['serum ferritin','ferritin'],                                    cat:'vitamin', unit:'ng/mL',    min:21.8, max:274.6, hib:false },
  { names:['tibc','total iron binding capacity'],                           cat:'vitamin', unit:'ug/dL',    min:250,  max:370,   hib:false },
  // IMMUNE / INFLAMMATION
  { names:['c reactive protein','crp'],                                     cat:'immune',  unit:'mg/L',     min:0,    max:5,     hib:false },
  { names:['hs-crp','high sensitivity crp','hscrp'],                       cat:'immune',  unit:'mg/L',     min:0,    max:1,     hib:false },
  { names:['total ige','ige','immunoglobulin e'],                           cat:'immune',  unit:'IU/mL',    min:0,    max:100,   hib:false },
  { names:['rheumatoid factor','rf test'],                                  cat:'immune',  unit:'IU/mL',    min:0,    max:20,    hib:false },
  { names:['pth','parathyroid hormone','ipth'],                             cat:'immune',  unit:'pg/mL',    min:15,   max:68.3,  hib:false },
  // CARDIAC
  { names:['troponin i','troponin t','cardiac troponin'],                   cat:'cardiac', unit:'ng/mL',    min:0,    max:0.04,  hib:false },
  { names:['bnp','b natriuretic peptide','pro bnp'],                        cat:'cardiac', unit:'pg/mL',    min:0,    max:100,   hib:false },
  { names:['creatine kinase','ck total','cpk total'],                       cat:'cardiac', unit:'U/L',      min:30,   max:200,   hib:false },
  { names:['ck-mb','ckmb','creatine kinase mb'],                            cat:'cardiac', unit:'U/L',      min:0,    max:25,    hib:false },
  { names:['ldh','lactate dehydrogenase'],                                  cat:'cardiac', unit:'U/L',      min:120,  max:246,   hib:false },
];

// ── Text → Parameters ─────────────────────────────────────────────────────────
function extractParameters(rawText) {
  const textLower = rawText.toLowerCase();
  const found = [];
  const usedNames = new Set();

  // detect meta fields
  let lab_name = null, doctor_name = null, report_date = null;
  for (const line of rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean)) {
    const ll = line.toLowerCase();
    if (!lab_name && (ll.includes('diagnostic') || ll.includes('laboratory') || ll.includes('pathology') || ll.includes('lab ')))
      if (line.length < 80) lab_name = line.replace(/[:\-–|]/g,'').trim();
    if (!doctor_name) {
      const m = line.match(/dr\.?\s+([A-Za-z\s]{3,40})/i);
      if (m) doctor_name = 'Dr. ' + m[1].trim();
    }
    if (!report_date) {
      const m = line.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
      if (m) { const y = m[3].length===2?'20'+m[3]:m[3]; report_date = `${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; }
    }
  }

  for (const p of PARAM_DB) {
    if (usedNames.has(p.names[0])) continue;
    for (const alias of p.names) {
      const idx = textLower.indexOf(alias.toLowerCase());
      if (idx === -1) continue;

      const window = rawText.slice(idx, idx + 200);
      const numMatch = window.match(/[:\s|\/]\s*([0-9]+\.?[0-9]*)/);
      if (!numMatch) continue;

      const value = parseFloat(numMatch[1]);
      if (isNaN(value) || value <= 0 || value > 999999) continue;

      let norm_min = p.min, norm_max = p.max;
      const rangeMatches = window.match(/([0-9]+\.?[0-9]*)\s*[-–to]+\s*([0-9]+\.?[0-9]*)/g) || [];
      for (const rm of rangeMatches) {
        const parts = rm.match(/([0-9]+\.?[0-9]*)\s*[-–to]+\s*([0-9]+\.?[0-9]*)/);
        if (parts) {
          const lo = parseFloat(parts[1]), hi = parseFloat(parts[2]);
          if (!isNaN(lo) && !isNaN(hi) && hi > lo && lo !== value && hi !== value) { norm_min = lo; norm_max = hi; break; }
        }
      }

      const displayName = p.names[0].split(' ').map(w => w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
      if (usedNames.has(displayName)) break;
      usedNames.add(displayName);

      const status = p.hib
        ? (value < norm_min ? 'low' : 'normal')
        : (value > norm_max ? 'high' : value < norm_min ? 'low' : 'normal');

      found.push({ name: displayName, category: p.cat, value, unit: p.unit, norm_min, norm_max, is_higher_better: p.hib, status });
      break;
    }
  }
  return { lab_name, doctor_name, report_date, parameters: found };
}

// ── File → Text ───────────────────────────────────────────────────────────────
async function extractText(filePath, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse');
    return (await pdfParse(fs.readFileSync(filePath))).text || '';
  }
  const { createWorker } = require('tesseract.js');
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(filePath);
  await worker.terminate();
  return text || '';
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── GET /api/reports/member/:memberId ────────────────────────────────────────
router.get('/member/:memberId', (req, res) => {
  const db = getDb(req);
  const member = db.prepare('SELECT * FROM family_members WHERE id = ? AND user_id = ?').get(req.params.memberId, req.user.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });

  const reports = db.prepare(`
    SELECT r.*,
      (SELECT COUNT(*) FROM report_parameters rp WHERE rp.report_id = r.id) as param_count
    FROM reports r
    WHERE r.member_id = ? AND r.user_id = ?
    ORDER BY r.year DESC, r.month DESC
  `).all(req.params.memberId, req.user.id);
  res.json(reports);
});

// ── GET /api/reports/:reportId ───────────────────────────────────────────────
router.get('/:reportId', (req, res) => {
  const db = getDb(req);
  // skip non-id paths like 'upload' and 'manual'
  if (['upload','manual'].includes(req.params.reportId)) return res.status(404).json({ error: 'Not found' });

  const report = db.prepare('SELECT * FROM reports WHERE id = ? AND user_id = ?').get(req.params.reportId, req.user.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  const params = db.prepare('SELECT * FROM report_parameters WHERE report_id = ? ORDER BY category, name').all(req.params.reportId);
  res.json({ ...report, parameters: params });
});

// ── POST /api/reports/upload ─────────────────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const db = getDb(req);
  const { memberId, year, month, lab_name, doctor_name, notes } = req.body;
  if (!memberId) return res.status(400).json({ error: 'memberId is required' });

  const member = db.prepare('SELECT * FROM family_members WHERE id = ? AND user_id = ?').get(memberId, req.user.id);
  if (!member) return res.status(404).json({ error: 'Family member not found' });

  try {
    const rawText = await extractText(req.file.path, req.file.originalname);

    const reportYear  = year  || String(new Date().getFullYear());
    const reportMonth = month || MONTHS[new Date().getMonth()];
    const reportId    = uuidv4();
    const label       = `${reportMonth} ${reportYear}`;

    if (!rawText || rawText.trim().length < 20) {
      db.prepare(`INSERT INTO reports (id, member_id, user_id, label, year, month, lab_name, doctor_name, notes, file_path, file_name, file_size, extracted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).run(reportId, memberId, req.user.id, label, reportYear, reportMonth,
            lab_name||null, doctor_name||null, notes||null, req.file.path, req.file.originalname, req.file.size);
      return res.json({ success: true, extracted_count: 0, warning: 'Could not read text from file. Report saved — add parameters manually.', report: db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId) });
    }

    const extracted = extractParameters(rawText);
    const finalYear  = year  || (extracted.report_date ? extracted.report_date.slice(0,4) : reportYear);
    const finalMonth = month || (extracted.report_date ? MONTHS[parseInt(extracted.report_date.slice(5,7))-1] : reportMonth);
    const finalLabel = `${finalMonth} ${finalYear}`;

    db.prepare(`INSERT INTO reports (id, member_id, user_id, label, year, month, lab_name, doctor_name, notes, file_path, file_name, file_size, extracted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(reportId, memberId, req.user.id, finalLabel, finalYear, finalMonth,
          lab_name||extracted.lab_name||null, doctor_name||extracted.doctor_name||null,
          notes||null, req.file.path, req.file.originalname, req.file.size);

    const insertParam = db.prepare(`INSERT INTO report_parameters
      (id, report_id, name, category, value, unit, norm_min, norm_max, is_higher_better, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    db.transaction(params => {
      for (const p of params)
        insertParam.run(uuidv4(), reportId, p.name, p.category, p.value, p.unit, p.norm_min, p.norm_max, p.is_higher_better?1:0, p.status);
    })(extracted.parameters);

    const savedReport = db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId);
    const savedParams = db.prepare('SELECT * FROM report_parameters WHERE report_id = ?').all(reportId);
    res.json({ success: true, report: { ...savedReport, parameters: savedParams }, extracted_count: savedParams.length });

  } catch (err) {
    try { fs.unlinkSync(req.file.path); } catch(e) {}
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process file: ' + err.message });
  }
});

// ── DELETE /api/reports/:reportId ────────────────────────────────────────────
router.delete('/:reportId', (req, res) => {
  const db = getDb(req);
  const report = db.prepare('SELECT * FROM reports WHERE id = ? AND user_id = ?').get(req.params.reportId, req.user.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  if (report.file_path && fs.existsSync(report.file_path)) try { fs.unlinkSync(report.file_path); } catch(e) {}
  db.prepare('DELETE FROM report_parameters WHERE report_id = ?').run(req.params.reportId);
  db.prepare('DELETE FROM reports WHERE id = ?').run(req.params.reportId);
  res.json({ success: true });
});

// ── GET /api/reports/:reportId/file ─────────────────────────────────────────
router.get('/:reportId/file', (req, res) => {
  const db = getDb(req);
  const report = db.prepare('SELECT * FROM reports WHERE id = ? AND user_id = ?').get(req.params.reportId, req.user.id);
  if (!report || !report.file_path) return res.status(404).json({ error: 'File not found' });
  res.sendFile(path.resolve(report.file_path));
});

module.exports = router;
