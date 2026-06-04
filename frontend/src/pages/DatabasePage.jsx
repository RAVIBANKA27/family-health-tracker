import { useState, useEffect } from 'react'
import { api } from '../utils/api'

const TABLE_META = {
  family_members:    { label: 'Family Members',     icon: '👨‍👩‍👧', cols: ['name','relationship','gender','dob','blood_group','created_at'] },
  reports:           { label: 'Reports',             icon: '📋', cols: ['label','year','month','lab_name','doctor_name','file_name','created_at'] },
  report_parameters: { label: 'Report Parameters',  icon: '🔬', cols: ['name','category','value','unit','norm_min','norm_max','status'] },
  doctor_shares:     { label: 'Doctor Shares',      icon: '🔗', cols: ['doctor_name','doctor_email','expires_at','viewed_at','created_at'] },
}

export default function DatabasePage({ showToast }) {
  const [summary, setSummary]     = useState(null)
  const [activeTable, setActive]  = useState('reports')
  const [rows, setRows]           = useState([])
  const [loading, setLoading]     = useState(false)
  const [search, setSearch]       = useState('')

  useEffect(() => { loadSummary() }, [])
  useEffect(() => { loadTable(activeTable) }, [activeTable])

  async function loadSummary() {
    try { setSummary(await apiFetch('/api/db/summary')) } catch(e) {}
  }

  async function loadTable(name) {
    setLoading(true); setSearch('')
    try { setRows(await apiFetch(`/api/db/table/${name}`)) }
    catch(e) { showToast(e.message, 'error') }
    finally { setLoading(false) }
  }

  function exportJSON() {
    window.location.href = '/api/db/export'
    showToast('JSON export downloading…', 'success')
  }

  function exportCSV(table) {
    window.location.href = `/api/db/export/csv/${table}`
    showToast(`CSV export for ${table} downloading…`, 'success')
  }

  const meta  = TABLE_META[activeTable]
  const token = localStorage.getItem('health_token')

  const filtered = rows.filter(r =>
    !search || Object.values(r).some(v =>
      v != null && String(v).toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700 }}>Database</h1>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
          View, browse, and export all your health data stored in the local SQLite database.
        </p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
          {Object.entries(TABLE_META).map(([key, m]) => (
            <div key={key} className="card"
              onClick={() => setActive(key)}
              style={{
                cursor: 'pointer',
                borderColor: activeTable === key ? 'var(--accent)' : 'var(--border)',
                background: activeTable === key ? 'var(--info-bg)' : 'var(--surface)',
                transition: 'all .12s'
              }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{m.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--serif)', color: activeTable===key?'var(--accent)':'var(--text)' }}>
                {summary.tables[key] ?? 0}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
          <div className="card" style={{ display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>💾</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--serif)' }}>{summary.size_kb} KB</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>DB File Size</div>
          </div>
        </div>
      )}

      {/* DB file path info */}
      {summary && (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12 }}>
          <strong>📂 Database file location:</strong>{' '}
          <code style={{ fontFamily: 'monospace', background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>
            {summary.db_path}
          </code>
          <span style={{ color: 'var(--muted)', marginLeft: 10 }}>— back this file up regularly to keep your data safe.</span>
        </div>
      )}

      {/* Export buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', alignSelf: 'center', marginRight: 4 }}>Export all data:</div>
        <button className="btn btn-primary btn-sm" onClick={exportJSON}>⬇ Full JSON Backup</button>
        <button className="btn btn-sm" onClick={() => exportCSV('reports')}>📊 Reports CSV</button>
        <button className="btn btn-sm" onClick={() => exportCSV('report_parameters')}>🔬 Parameters CSV</button>
        <button className="btn btn-sm" onClick={() => exportCSV('family_members')}>👨‍👩‍👧 Members CSV</button>
      </div>

      {/* Table browser */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
          {Object.entries(TABLE_META).map(([key, m]) => (
            <button key={key}
              onClick={() => setActive(key)}
              style={{
                padding: '10px 16px', border: 'none', borderBottom: '2px solid',
                borderBottomColor: activeTable === key ? 'var(--accent)' : 'transparent',
                background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                color: activeTable === key ? 'var(--accent)' : 'var(--muted)',
                fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', gap: 6
              }}>
              {m.icon} {m.label}
              <span style={{ background: activeTable===key?'var(--accent)':'var(--border)', color: activeTable===key?'#fff':'var(--muted)', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
                {summary?.tables[key] ?? '…'}
              </span>
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            className="form-input" style={{ maxWidth: 300, margin: 0 }}
            placeholder={`🔍 Search in ${meta.label}…`}
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {loading ? 'Loading…' : `${filtered.length} of ${rows.length} rows`}
          </span>
          <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => exportCSV(activeTable)}>
            ⬇ Export this table as CSV
          </button>
        </div>

        {/* Table */}
        {loading
          ? <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto', width: 28, height: 28 }} /></div>
          : filtered.length === 0
            ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No rows found.</div>
            : (
              <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
                <table>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      {meta.cols.map(c => <th key={c}>{c.replace(/_/g,' ')}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row, i) => (
                      <tr key={i}>
                        {meta.cols.map(c => (
                          <td key={c} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {renderCell(c, row[c])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      </div>

      {/* Backup instructions */}
      <div style={{ marginTop: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>🛡️ How to Back Up Your Database</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
          <div>
            <strong style={{ color: 'var(--text)' }}>Option 1 — Export JSON (recommended)</strong><br/>
            Click the <strong>Full JSON Backup</strong> button above. This downloads a single file with all your members, reports and parameters. You can re-import it later if needed.
          </div>
          <div>
            <strong style={{ color: 'var(--text)' }}>Option 2 — Copy the DB file</strong><br/>
            Go to <code>backend/data/</code> in your project folder and copy <code>health_tracker.db</code> to a safe place (Google Drive, USB, etc.). This is a complete snapshot of everything.
          </div>
          <div>
            <strong style={{ color: 'var(--text)' }}>Option 3 — Export as CSV</strong><br/>
            Click any CSV export button to get a spreadsheet-compatible file that can be opened in Excel or Google Sheets.
          </div>
          <div>
            <strong style={{ color: 'var(--text)' }}>To restore from backup</strong><br/>
            Replace <code>backend/data/health_tracker.db</code> with your backed-up copy and restart the server. All data will be restored exactly as it was.
          </div>
        </div>
      </div>

    </div>
  )
}

function renderCell(col, val) {
  if (val == null || val === '') return <span style={{ color: 'var(--muted)' }}>—</span>
  if (col === 'status') {
    const color = val === 'normal' ? 'var(--good)' : val === 'high' ? 'var(--warn)' : val === 'low' ? 'var(--amber)' : 'var(--muted)'
    const bg    = val === 'normal' ? 'var(--good-bg)' : val === 'high' ? 'var(--warn-bg)' : val === 'low' ? 'var(--amber-bg)' : 'var(--surface2)'
    return <span style={{ color, background: bg, padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{val.toUpperCase()}</span>
  }
  if (col === 'value') return <strong>{val}</strong>
  if (col === 'created_at' || col === 'extracted_at' || col === 'expires_at' || col === 'viewed_at') {
    if (!val) return <span style={{ color: 'var(--muted)' }}>—</span>
    return new Date(val).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
  }
  if (col === 'is_higher_better') return val ? '↑ Yes' : '↓ No'
  return String(val)
}

// lightweight fetch with auth
async function apiFetch(url) {
  const token = localStorage.getItem('health_token')
  const r = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || 'Request failed')
  return data
}
