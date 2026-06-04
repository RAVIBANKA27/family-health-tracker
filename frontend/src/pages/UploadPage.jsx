import { useState, useEffect, useRef } from 'react'
import { api } from '../utils/api'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const YEARS = Array.from({length: 10}, (_,i) => String(new Date().getFullYear() - i))

export default function UploadPage({ members, selectedMember, setSelectedMember, loadMembers, showToast }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [logs, setLogs] = useState([])
  const [form, setForm] = useState({
    year: String(new Date().getFullYear()),
    month: MONTHS[new Date().getMonth()],
    lab_name: '', doctor_name: ''
  })
  const fileRef = useRef()
  const logsRef = useRef()

  useEffect(() => { if (selectedMember) loadReports() }, [selectedMember])
  useEffect(() => { if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight }, [logs])

  function log(msg, type = 'info') { setLogs(l => [...l, { msg, type }]) }

  async function loadReports() {
    if (!selectedMember) return
    setLoading(true)
    try { setReports(await api.getReports(selectedMember.id)) }
    catch (e) { showToast(e.message, 'error') }
    finally { setLoading(false) }
  }

  async function handleFile(file) {
    if (!file) return
    if (!selectedMember) { showToast('Please select a family member first', 'error'); return }
    setUploading(true)
    setLogs([])
    log(`📋 File selected: ${file.name} (${(file.size/1024).toFixed(0)} KB)`)
    log(`🔍 Reading and parsing report text...`)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('memberId', selectedMember.id)
    fd.append('year', form.year)
    fd.append('month', form.month)
    if (form.lab_name) fd.append('lab_name', form.lab_name)
    if (form.doctor_name) fd.append('doctor_name', form.doctor_name)

    try {
      const result = await api.uploadReport(fd)
      if (result.warning) {
        log(`⚠ ${result.warning}`, 'warn')
        showToast('File saved but no parameters detected. You can add them manually.', 'error')
      } else {
        log(`✅ Extracted ${result.extracted_count} parameters automatically`, 'ok')
        log(`📊 Report saved as: ${result.report.label}`, 'ok')
        showToast(`Done! ${result.extracted_count} parameters extracted.`, 'success')
      }
      loadReports()
      loadMembers()
    } catch (e) {
      log(`❌ Error: ${e.message}`, 'error')
      showToast(e.message, 'error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function deleteReport(r) {
    if (!confirm(`Delete "${r.label}"? This cannot be undone.`)) return
    try {
      await api.deleteReport(r.id)
      showToast('Report deleted')
      loadReports(); loadMembers()
    } catch (e) { showToast(e.message, 'error') }
  }

  const grouped = reports.reduce((acc, r) => {
    if (!acc[r.year]) acc[r.year] = []
    acc[r.year].push(r)
    return acc
  }, {})

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '20px 24px 16px' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Reports &amp; Upload</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
          Upload PDF or image reports. The smart parser automatically reads the text and fills in all known health parameters — no API key or internet needed.
        </p>
      </div>

      {/* How it works banner */}
      <div style={{ background: 'var(--info-bg)', border: '1px solid var(--info)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 12, color: 'var(--info)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 16 }}>💡</span>
        <div>
          <strong>How extraction works (100% free, no API):</strong> The app reads text directly from your PDF or uses OCR on images, then matches 60+ known lab test names (Haemoglobin, TSH, HbA1c, Cholesterol, etc.) using a built-in dictionary. Reference ranges are picked from the report itself when available.
        </div>
      </div>

      {/* Member selector */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Uploading report for</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {members.map(m => (
            <div key={m.id} onClick={() => setSelectedMember(m)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
                borderRadius: 20, cursor: 'pointer', border: '1.5px solid',
                borderColor: selectedMember?.id === m.id ? 'var(--accent)' : 'var(--border)',
                background: selectedMember?.id === m.id ? 'var(--info-bg)' : 'transparent',
                transition: 'all .12s'
              }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: m.color || 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                {m.avatar_initials}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</span>
            </div>
          ))}
          {members.length === 0 && <span style={{ fontSize: 13, color: 'var(--muted)' }}>Add a family member from the sidebar first.</span>}
        </div>
      </div>

      {/* Upload form */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Year', key: 'year', type: 'select', opts: YEARS },
            { label: 'Month', key: 'month', type: 'select', opts: MONTHS },
            { label: 'Lab Name (optional)', key: 'lab_name', type: 'text', ph: 'Auto-detected' },
            { label: 'Doctor (optional)', key: 'doctor_name', type: 'text', ph: 'Auto-detected' },
          ].map(f => (
            <div className="form-group" style={{ marginBottom: 0 }} key={f.key}>
              <label className="form-label">{f.label}</label>
              {f.type === 'select'
                ? <select className="form-select" value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}>
                    {f.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                : <input className="form-input" value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} placeholder={f.ph} />
              }
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <div
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 12, padding: '32px 24px', textAlign: 'center', cursor: uploading ? 'default' : 'pointer',
            background: dragOver ? 'var(--info-bg)' : 'var(--bg)', transition: 'all .2s'
          }}
          onClick={() => !uploading && fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
        >
          <div style={{ fontSize: 30, marginBottom: 8 }}>📋</div>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            {uploading ? 'Processing your report…' : 'Drop lab report here'}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            {uploading ? 'Reading text and matching parameters…' : 'Supports PDF, JPG, PNG · Max 20 MB'}
          </p>
          {!uploading && (
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={e => { e.stopPropagation(); fileRef.current?.click() }}>
              Choose File
            </button>
          )}
          {uploading && <div className="spinner" style={{ margin: '12px auto 0', width: 26, height: 26 }} />}
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />
        </div>

        {/* Log output */}
        {logs.length > 0 && (
          <div ref={logsRef} style={{
            background: '#1c1917', color: '#a8a29e', borderRadius: 8, padding: '10px 14px',
            fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7, maxHeight: 160, overflowY: 'auto', marginTop: 12
          }}>
            {logs.map((l, i) => (
              <div key={i} style={{ color: l.type === 'ok' ? '#86efac' : l.type === 'error' ? '#fca5a5' : l.type === 'warn' ? '#fcd34d' : '#93c5fd' }}>
                {l.msg}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reports library */}
      {selectedMember && (
        <>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 700, marginBottom: 14 }}>
            {selectedMember.name}'s Reports
            {loading && <span className="spinner" style={{ marginLeft: 10, width: 14, height: 14 }} />}
          </h2>

          {reports.length === 0 && !loading && (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <div className="empty-title">No reports yet</div>
              <div className="empty-sub">Upload the first report above to get started.</div>
            </div>
          )}

          {Object.entries(grouped).sort((a,b) => b[0]-a[0]).map(([year, reps]) => (
            <div key={year} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 15 }}>{year}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{reps.length} report{reps.length !== 1 ? 's' : ''}</span>
              </div>
              {reps.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: (r.param_count||0) > 0 ? 'var(--good)' : 'var(--amber)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{r.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>
                      {r.lab_name || 'Unknown Lab'}{r.doctor_name ? ` · ${r.doctor_name}` : ''} · {r.param_count || 0} parameters
                    </span>
                  </div>
                  {r.file_name && (
                    <a href={`/api/reports/${r.id}/file`} target="_blank" rel="noreferrer" className="btn btn-sm" title="View original file">📄</a>
                  )}
                  <button className="btn btn-sm" style={{ color: 'var(--warn)' }} onClick={() => deleteReport(r)}>🗑</button>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
