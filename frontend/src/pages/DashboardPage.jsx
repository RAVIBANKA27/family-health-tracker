import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { api } from '../utils/api'
import ShareModal from '../components/ShareModal'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const CATEGORIES = ['all','cbc','sugar','lipid','liver','kidney','thyroid','vitamin','immune','cardiac']
const CAT_LABELS = { all:'All', cbc:'CBC', sugar:'Sugar', lipid:'Lipids', liver:'Liver', kidney:'Kidney', thyroid:'Thyroid', vitamin:'Vitamins', immune:'Immunity', cardiac:'Cardiac' }

export default function DashboardPage({ members, selectedMember, showToast }) {
  const [reports, setReports] = useState([])
  const [fullReports, setFullReports] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [category, setCategory] = useState('all')
  const [abnormalOnly, setAbnormalOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showShare, setShowShare] = useState(false)

  useEffect(() => {
    if (selectedMember) loadReports()
  }, [selectedMember])

  async function loadReports() {
    setLoading(true)
    try {
      const reps = await api.getReports(selectedMember.id)
      setReports(reps)
      // Load full reports with params
      const full = await Promise.all(reps.map(r => api.getReport(r.id)))
      setFullReports(full)
      setSelectedIds(full.map(r => r.id))
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectedReports = fullReports.filter(r => selectedIds.includes(r.id))
    .sort((a, b) => a.year - b.year || MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month))

  // Build parameter map
  const paramMap = {}
  selectedReports.forEach(r => {
    (r.parameters || []).forEach(p => {
      if (!paramMap[p.name]) paramMap[p.name] = { meta: p, vals: {} }
      paramMap[p.name].vals[r.id] = p.value
    })
  })

  const allParams = Object.entries(paramMap)
  const displayParams = allParams.filter(([name, pm]) => {
    if (category !== 'all' && pm.meta.category !== category) return false
    if (abnormalOnly) {
      const lastVal = selectedReports.map(r => pm.vals[r.id]).filter(v => v != null).slice(-1)[0]
      if (lastVal == null) return false
      return lastVal > pm.meta.norm_max || lastVal < pm.meta.norm_min
    }
    return true
  })

  // Summary cards
  const totalParams = allParams.length
  const abnormal = allParams.filter(([, pm]) => {
    const v = selectedReports.map(r => pm.vals[r.id]).filter(x => x != null).slice(-1)[0]
    return v != null && (v > pm.meta.norm_max || v < pm.meta.norm_min)
  }).length
  const normal = totalParams - abnormal

  function toggleId(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  if (!selectedMember) {
    return (
      <div className="empty-state" style={{ paddingTop: 80 }}>
        <div className="empty-icon">👨‍👩‍👧‍👦</div>
        <div className="empty-title">Select a Family Member</div>
        <div className="empty-sub">Choose a family member from the sidebar to view their health dashboard.</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700 }}>{selectedMember.name}'s Dashboard</h1>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {selectedMember.relationship}{selectedMember.gender ? ` · ${selectedMember.gender}` : ''}{selectedMember.blood_group ? ` · Blood: ${selectedMember.blood_group}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-success" onClick={() => setShowShare(true)} disabled={selectedReports.length === 0}>⤴ Share with Doctor</button>
          <button className="btn btn-primary" onClick={() => window.print()}>⬇ Download PDF</button>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} /></div>}

      {!loading && fullReports.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🧬</div>
          <div className="empty-title">No reports yet</div>
          <div className="empty-sub">Upload lab reports from the Reports & Upload tab. AI will automatically extract all values.</div>
        </div>
      )}

      {!loading && fullReports.length > 0 && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Reports', val: reports.length, color: 'var(--accent)', bg: 'var(--info-bg)' },
              { label: 'Parameters', val: totalParams, color: 'var(--text)', bg: 'var(--surface)' },
              { label: 'Normal', val: normal, color: 'var(--good)', bg: 'var(--good-bg)' },
              { label: 'Abnormal', val: abnormal, color: 'var(--warn)', bg: 'var(--warn-bg)' },
            ].map(c => (
              <div key={c.label} className="card" style={{ background: c.bg, cursor: 'default' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>{c.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--serif)', color: c.color }}>{c.val}</div>
              </div>
            ))}
          </div>

          {/* Report selector chips */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Reports on display (click to toggle)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {fullReports.sort((a,b) => a.year - b.year).map(r => (
                <div key={r.id}
                  onClick={() => toggleId(r.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                    borderRadius: 20, fontSize: 12, border: '1px solid',
                    borderColor: selectedIds.includes(r.id) ? 'var(--accent)' : 'var(--border)',
                    background: selectedIds.includes(r.id) ? 'var(--accent)' : 'transparent',
                    color: selectedIds.includes(r.id) ? '#fff' : 'var(--text)',
                    cursor: 'pointer', transition: 'all .12s'
                  }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: selectedIds.includes(r.id) ? '#fff' : 'var(--good)' }} />
                  {r.label}
                </div>
              ))}
            </div>
          </div>

          {/* Category filters */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginRight: 4 }}>Filter</span>
            {CATEGORIES.map(c => (
              <button key={c}
                onClick={() => setCategory(c)}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  border: '1px solid', borderColor: category === c ? 'var(--accent)' : 'var(--border)',
                  background: category === c ? 'var(--accent)' : 'transparent',
                  color: category === c ? '#fff' : 'var(--muted)', transition: 'all .12s'
                }}>{CAT_LABELS[c]}</button>
            ))}
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
            <button
              onClick={() => setAbnormalOnly(v => !v)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                border: '1px solid', borderColor: abnormalOnly ? 'var(--warn)' : 'var(--border)',
                background: abnormalOnly ? 'var(--warn-bg)' : 'transparent',
                color: abnormalOnly ? 'var(--warn)' : 'var(--muted)', fontWeight: 600
              }}>⚠ Abnormal Only</button>
          </div>

          {/* Charts */}
          {displayParams.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>Trend Charts</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Values across selected reports with normal range shaded</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {displayParams.slice(0, 20).map(([name, pm]) => (
                  <ParameterChart key={name} name={name} pm={pm} reports={selectedReports} />
                ))}
              </div>
            </div>
          )}

          {/* Comparison Table */}
          {displayParams.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>Full Comparison Table</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>All parameters — % change and status</div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      {selectedReports.map(r => <th key={r.id}>{r.label}</th>)}
                      <th>Range</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayParams.map(([name, pm]) => {
                      const vals = selectedReports.map(r => pm.vals[r.id])
                      const lastVal = [...vals].reverse().find(v => v != null)
                      const status = lastVal == null ? 'unknown'
                        : pm.meta.is_higher_better
                          ? (lastVal < pm.meta.norm_min ? 'low' : 'normal')
                          : (lastVal > pm.meta.norm_max ? 'high' : lastVal < pm.meta.norm_min ? 'low' : 'normal')
                      return (
                        <tr key={name}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{name}</div>
                            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>{pm.meta.category}</div>
                          </td>
                          {vals.map((v, i) => (
                            <td key={i} style={{ fontWeight: 700, fontSize: 13,
                              color: v == null ? 'var(--muted)' :
                                (pm.meta.is_higher_better ? v < pm.meta.norm_min : v > pm.meta.norm_max) ? 'var(--warn)' :
                                (!pm.meta.is_higher_better && v < pm.meta.norm_min) ? 'var(--amber)' : 'inherit'
                            }}>
                              {v != null ? v : '—'} {v != null ? <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>{pm.meta.unit}</span> : null}
                            </td>
                          ))}
                          <td style={{ fontSize: 11, color: 'var(--muted)' }}>{pm.meta.norm_min}–{pm.meta.norm_max} {pm.meta.unit}</td>
                          <td>
                            <span className={`tag ${status === 'normal' ? 'tag-good' : status === 'high' ? 'tag-warn' : status === 'low' ? 'tag-amber' : 'tag-muted'}`}>
                              {status === 'normal' ? '✓ Normal' : status === 'high' ? '↑ High' : status === 'low' ? '↓ Low' : '—'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ fontSize: 11, color: 'var(--muted)', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <strong>Disclaimer:</strong> This tracker is for personal health awareness only. Please consult your treating physician for clinical interpretation, diagnosis, and treatment decisions.
          </div>
        </>
      )}

      {showShare && (
        <ShareModal
          member={selectedMember}
          reports={fullReports}
          selectedIds={selectedIds}
          onClose={() => setShowShare(false)}
          showToast={showToast}
        />
      )}
    </div>
  )
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function ParameterChart({ name, pm, reports }) {
  const labels = reports.map(r => r.label)
  const vals = reports.map(r => pm.vals[r.id] ?? null)
  const normMin = pm.meta.norm_min
  const normMax = pm.meta.norm_max

  const data = {
    labels,
    datasets: [
      {
        label: name,
        data: vals,
        borderColor: '#1e4d7a',
        backgroundColor: 'rgba(30,77,122,0.08)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: vals.map(v =>
          v == null ? 'transparent' :
          (pm.meta.is_higher_better ? v < normMin : v > normMax) ? '#b91c1c' :
          (!pm.meta.is_higher_better && v < normMin) ? '#92400e' : '#15803d'
        ),
        tension: 0.3,
        spanGaps: true,
      },
      normMin != null && {
        label: 'Normal Min',
        data: reports.map(() => normMin),
        borderColor: 'rgba(21,128,61,0.3)',
        borderDash: [4,4],
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
      },
      normMax != null && {
        label: 'Normal Max',
        data: reports.map(() => normMax),
        borderColor: 'rgba(21,128,61,0.3)',
        borderDash: [4,4],
        borderWidth: 1,
        pointRadius: 0,
        fill: '-1',
        backgroundColor: 'rgba(21,128,61,0.05)',
      }
    ].filter(Boolean)
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => `${ctx.parsed.y} ${pm.meta.unit}` } }
    },
    scales: {
      y: { ticks: { font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { ticks: { font: { size: 10 } } }
    }
  }

  const lastVal = [...vals].reverse().find(v => v != null)
  const status = lastVal == null ? null
    : (pm.meta.is_higher_better ? lastVal < normMin : lastVal > normMax) ? 'high'
    : (!pm.meta.is_higher_better && lastVal < normMin) ? 'low' : 'normal'

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{pm.meta.unit} · Range: {normMin}–{normMax}</div>
        </div>
        {status && <span className={`tag ${status === 'normal' ? 'tag-good' : status === 'high' ? 'tag-warn' : 'tag-amber'}`}>
          {status === 'normal' ? '✓' : status === 'high' ? '↑ High' : '↓ Low'}
        </span>}
      </div>
      <div style={{ height: 160 }}>
        <Line data={data} options={options} />
      </div>
    </div>
  )
}
