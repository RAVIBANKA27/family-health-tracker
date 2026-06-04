import { useState, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { api } from '../utils/api'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function TrendsPage({ members, selectedMember, showToast }) {
  const [fullReports, setFullReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  useEffect(() => {
    if (selectedMember) loadReports()
  }, [selectedMember])

  async function loadReports() {
    setLoading(true)
    try {
      const reps = await api.getReports(selectedMember.id)
      const full = await Promise.all(reps.map(r => api.getReport(r.id)))
      setFullReports(full.sort((a,b) => a.year - b.year))
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Build master param map
  const paramMap = {}
  fullReports.forEach(r => {
    (r.parameters || []).forEach(p => {
      if (!paramMap[p.name]) paramMap[p.name] = { meta: p, byReport: {} }
      paramMap[p.name].byReport[r.id] = p.value
    })
  })

  const cats = ['all', ...new Set(Object.values(paramMap).map(p => p.meta.category))]
  const params = Object.entries(paramMap).filter(([name, pm]) => {
    if (category !== 'all' && pm.meta.category !== category) return false
    if (search && !name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (!selectedMember) return (
    <div className="empty-state" style={{ paddingTop: 80 }}>
      <div className="empty-icon">📈</div>
      <div className="empty-title">Select a Family Member</div>
      <div className="empty-sub">Choose from the sidebar to view detailed trends.</div>
    </div>
  )

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700 }}>All Trends — {selectedMember.name}</h1>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Individual parameter trends across all reports</div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} /></div>}

      {!loading && fullReports.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">No data yet</div>
          <div className="empty-sub">Upload at least one report to see trends.</div>
        </div>
      )}

      {!loading && fullReports.length > 0 && (
        <>
          {/* Controls */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="form-input" style={{ maxWidth: 240 }} placeholder="🔍 Search parameter..." value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {cats.map(c => (
                <button key={c}
                  onClick={() => setCategory(c)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    border: '1px solid', borderColor: category === c ? 'var(--accent)' : 'var(--border)',
                    background: category === c ? 'var(--accent)' : 'transparent',
                    color: category === c ? '#fff' : 'var(--muted)', textTransform: 'capitalize'
                  }}>{c}</button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
            Showing {params.length} of {Object.keys(paramMap).length} parameters
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {params.map(([name, pm]) => (
              <TrendCard key={name} name={name} pm={pm} reports={fullReports} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TrendCard({ name, pm, reports }) {
  const labels = reports.map(r => r.label)
  const vals = reports.map(r => pm.byReport[r.id] ?? null)
  const normMax = pm.meta.norm_max
  const normMin = pm.meta.norm_min

  const bgColors = vals.map(v => {
    if (v == null) return 'rgba(200,200,200,0.3)'
    if (pm.meta.is_higher_better) return v < normMin ? 'rgba(146,64,14,0.7)' : 'rgba(21,128,61,0.7)'
    return v > normMax ? 'rgba(185,28,28,0.7)' : v < normMin ? 'rgba(146,64,14,0.7)' : 'rgba(21,128,61,0.7)'
  })

  const data = {
    labels,
    datasets: [{
      label: name,
      data: vals,
      backgroundColor: bgColors,
      borderRadius: 4,
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => `${ctx.parsed.y} ${pm.meta.unit}` } }
    },
    scales: {
      y: {
        ticks: { font: { size: 10 } },
        grid: { color: 'rgba(0,0,0,0.05)' },
        ...(normMin != null && normMax != null ? {
          afterDraw: (chart) => {
            const ctx = chart.ctx
            const yScale = chart.scales.y
            const xScale = chart.scales.x
            const top = yScale.getPixelForValue(normMax)
            const bottom = yScale.getPixelForValue(normMin)
            ctx.save()
            ctx.fillStyle = 'rgba(21,128,61,0.06)'
            ctx.fillRect(xScale.left, top, xScale.right - xScale.left, bottom - top)
            ctx.restore()
          }
        } : {})
      },
      x: { ticks: { font: { size: 10 } } }
    }
  }

  const lastVal = [...vals].reverse().find(v => v != null)
  const status = lastVal == null ? null
    : (pm.meta.is_higher_better ? lastVal < normMin : lastVal > normMax) ? 'high'
    : (!pm.meta.is_higher_better && lastVal < normMin) ? 'low' : 'normal'

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            {pm.meta.unit} · {normMin}–{normMax} {pm.meta.unit}
            {lastVal != null && <strong style={{ marginLeft: 6 }}>Latest: {lastVal}</strong>}
          </div>
        </div>
        {status && <span className={`tag ${status === 'normal' ? 'tag-good' : status === 'high' ? 'tag-warn' : 'tag-amber'}`}>
          {status === 'normal' ? '✓ Normal' : status === 'high' ? '↑ High' : '↓ Low'}
        </span>}
      </div>
      <div style={{ height: 150 }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}
