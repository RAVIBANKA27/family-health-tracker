import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../utils/api'

export default function SharedReportPage() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getSharedReport(token)
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load report'); setLoading(false) })
  }, [token])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🔒</div>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{error}</h2>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>This link may have expired or been revoked.</p>
    </div>
  )

  const { share, patient, reports } = data

  // Build combined param map
  const paramMap = {}
  reports.forEach(r => {
    (r.parameters || []).forEach(p => {
      if (!paramMap[p.name]) paramMap[p.name] = { meta: p, vals: {} }
      paramMap[p.name].vals[r.id] = p.value
    })
  })

  const abnormal = Object.entries(paramMap).filter(([, pm]) => {
    const v = reports.map(r => pm.vals[r.id]).filter(x => x != null).slice(-1)[0]
    return v != null && (v > pm.meta.norm_max || v < pm.meta.norm_min)
  })

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 40 }}>🏥</div>
            <div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700 }}>Health Report — {patient.name}</h1>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                Shared with Dr. {share.doctor_name}
                {share.expires_at ? ` · Expires ${new Date(share.expires_at).toLocaleDateString()}` : ''}
                · Prepared by {patient.shared_by}
              </div>
            </div>
          </div>
          {share.message && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--info-bg)', borderRadius: 8, fontSize: 13, color: 'var(--info)', fontStyle: 'italic' }}>
              "{share.message}"
            </div>
          )}
        </div>

        {/* Patient info */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)' }}>Patient Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Name', val: patient.name },
              { label: 'Gender', val: patient.gender || 'N/A' },
              { label: 'Blood Group', val: patient.blood_group || 'N/A' },
              { label: 'Reports', val: reports.length },
            ].map(c => (
              <div key={c.label}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{c.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Abnormal flags */}
        {abnormal.length > 0 && (
          <div className="card" style={{ marginBottom: 20, borderColor: 'var(--warn)', background: 'var(--warn-bg)' }}>
            <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, color: 'var(--warn)' }}>⚠ Parameters Needing Attention ({abnormal.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {abnormal.map(([name, pm]) => {
                const v = reports.map(r => pm.vals[r.id]).filter(x => x != null).slice(-1)[0]
                const flag = v > pm.meta.norm_max ? '↑ HIGH' : '↓ LOW'
                return (
                  <div key={name} style={{ background: 'white', border: '1px solid var(--warn)', borderRadius: 8, padding: '6px 10px', fontSize: 12 }}>
                    <strong>{flag}</strong> {name}: {v} {pm.meta.unit} (Normal: {pm.meta.norm_min}–{pm.meta.norm_max})
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Full comparison table */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)' }}>Full Parameter Table</div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Parameter</th>
                  {reports.map(r => <th key={r.id}>{r.label}</th>)}
                  <th>Normal Range</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(paramMap).map(([name, pm]) => {
                  const vals = reports.map(r => pm.vals[r.id])
                  const lastVal = [...vals].reverse().find(v => v != null)
                  const status = lastVal == null ? '—'
                    : (pm.meta.is_higher_better ? lastVal < pm.meta.norm_min : lastVal > pm.meta.norm_max) ? 'HIGH'
                    : (!pm.meta.is_higher_better && lastVal < pm.meta.norm_min) ? 'LOW' : 'Normal'
                  return (
                    <tr key={name}>
                      <td><span style={{ fontWeight: 600 }}>{name}</span></td>
                      {vals.map((v, i) => (
                        <td key={i} style={{ fontWeight: 700, color: v != null && (v > pm.meta.norm_max || v < pm.meta.norm_min) ? 'var(--warn)' : 'inherit' }}>
                          {v != null ? `${v} ${pm.meta.unit}` : '—'}
                        </td>
                      ))}
                      <td style={{ fontSize: 11, color: 'var(--muted)' }}>{pm.meta.norm_min}–{pm.meta.norm_max} {pm.meta.unit}</td>
                      <td><span className={`tag ${status === 'Normal' ? 'tag-good' : status === 'HIGH' ? 'tag-warn' : status === 'LOW' ? 'tag-amber' : 'tag-muted'}`}>{status}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 20 }}>
          This report was shared via FamilyHealth Tracker. For clinical queries, please contact the patient directly.
        </div>
      </div>
    </div>
  )
}
