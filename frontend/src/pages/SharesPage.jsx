import { useState, useEffect } from 'react'
import { api } from '../utils/api'

export default function SharesPage({ showToast }) {
  const [shares, setShares] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadShares() }, [])

  async function loadShares() {
    setLoading(true)
    try {
      const data = await api.getShares()
      setShares(data)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function deleteShare(s) {
    if (!confirm('Revoke this share link? The doctor will no longer be able to access it.')) return
    try {
      await api.deleteShare(s.id)
      showToast('Share link revoked')
      loadShares()
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  function copyLink(token) {
    const url = `${window.location.origin}/shared/${token}`
    navigator.clipboard.writeText(url)
    showToast('Link copied to clipboard!', 'success')
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700 }}>Shared Report Links</h1>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Manage links shared with doctors. You can revoke access at any time.</div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} /></div>}

      {!loading && shares.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <div className="empty-title">No shared links yet</div>
          <div className="empty-sub">Use "Share with Doctor" from the Dashboard to create a secure sharing link for your doctor.</div>
        </div>
      )}

      {shares.map(s => {
        const url = `${window.location.origin}/shared/${s.share_token}`
        const isExpired = s.expires_at && new Date(s.expires_at) < new Date()
        const reportIds = JSON.parse(s.report_ids || '[]')
        return (
          <div key={s.id} className="card" style={{ marginBottom: 12, opacity: isExpired ? 0.6 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{s.doctor_name}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{s.doctor_email}</span>
                  {isExpired ? <span className="tag tag-warn">Expired</span> : <span className="tag tag-good">Active</span>}
                  {s.viewed_at && <span className="tag tag-info">Viewed</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                  For: <strong>{s.member_name}</strong> · {reportIds.length} report{reportIds.length !== 1 ? 's' : ''}
                  {s.expires_at ? ` · Expires: ${new Date(s.expires_at).toLocaleDateString()}` : ' · No expiry'}
                  {s.viewed_at ? ` · Viewed: ${new Date(s.viewed_at).toLocaleDateString()}` : ' · Not yet viewed'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', background: 'var(--bg)', padding: '4px 8px', borderRadius: 4, wordBreak: 'break-all' }}>
                  {url}
                </div>
                {s.message && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, fontStyle: 'italic' }}>"{s.message}"</div>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {!isExpired && <button className="btn btn-sm" onClick={() => copyLink(s.share_token)}>📋 Copy</button>}
                <button className="btn btn-sm btn-danger" onClick={() => deleteShare(s)}>Revoke</button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
