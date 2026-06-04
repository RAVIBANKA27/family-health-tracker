import { useState } from 'react'
import { api } from '../utils/api'

export default function ShareModal({ member, reports, selectedIds, onClose, showToast }) {
  const [form, setForm] = useState({ doctorName: '', doctorEmail: '', message: '', expiryDays: '30' })
  const [shareReportIds, setShareReportIds] = useState(selectedIds.slice())
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  function toggleReport(id) {
    setShareReportIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleShare() {
    if (!form.doctorName.trim()) return showToast('Doctor name is required', 'error')
    if (!form.doctorEmail.trim()) return showToast('Doctor email is required', 'error')
    if (shareReportIds.length === 0) return showToast('Select at least one report', 'error')
    setLoading(true)
    try {
      const res = await api.createShare({
        memberId: member.id,
        reportIds: shareReportIds,
        doctorName: form.doctorName,
        doctorEmail: form.doctorEmail,
        message: form.message,
        expiryDays: form.expiryDays ? parseInt(form.expiryDays) : null,
      })
      setResult(res)
      showToast('Share link created!', 'success')
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(result.shareUrl)
    showToast('Link copied!', 'success')
  }

  function openEmail() {
    const subject = encodeURIComponent(`Health Report — ${member.name}`)
    const body = encodeURIComponent(
      `Dear Dr. ${form.doctorName},\n\nPlease find ${member.name}'s health report at the link below:\n\n${result.shareUrl}\n\n${form.message ? form.message + '\n\n' : ''}Regards,\n${member.name}`
    )
    window.open(`mailto:${form.doctorEmail}?subject=${subject}&body=${body}`)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div>
            <div className="modal-title">Share with Doctor</div>
            <div className="modal-sub">Create a secure read-only link for {member.name}'s reports</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {!result ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Doctor's Name *</label>
                  <input className="form-input" value={form.doctorName} onChange={e => setForm(f => ({...f, doctorName: e.target.value}))} placeholder="Dr. Mukesh Kochar" />
                </div>
                <div className="form-group">
                  <label className="form-label">Doctor's Email *</label>
                  <input className="form-input" type="email" value={form.doctorEmail} onChange={e => setForm(f => ({...f, doctorEmail: e.target.value}))} placeholder="doctor@clinic.com" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Message (optional)</label>
                <textarea className="form-textarea" value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} placeholder="Please review my latest reports and advise on the flagged parameters." />
              </div>
              <div className="form-group">
                <label className="form-label">Link Expiry</label>
                <select className="form-select" value={form.expiryDays} onChange={e => setForm(f => ({...f, expiryDays: e.target.value}))}>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="">No expiry</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Reports to Share</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {reports.map(r => (
                    <div key={r.id}
                      onClick={() => toggleReport(r.id)}
                      style={{
                        padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                        border: '1.5px solid', borderColor: shareReportIds.includes(r.id) ? 'var(--accent)' : 'var(--border)',
                        background: shareReportIds.includes(r.id) ? 'var(--info-bg)' : 'transparent',
                        fontWeight: shareReportIds.includes(r.id) ? 600 : 400
                      }}>{r.label}</div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Share Link Created!</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Send this link to Dr. {form.doctorName}</div>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all', marginBottom: 16, textAlign: 'left' }}>
                {result.shareUrl}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={copyLink}>📋 Copy Link</button>
                <button className="btn btn-success" onClick={openEmail}>✉ Open in Email</button>
              </div>
            </div>
          )}
        </div>
        {!result && (
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-success" onClick={handleShare} disabled={loading}>
              {loading ? <span className="spinner" /> : '⤴ Create Share Link'}
            </button>
          </div>
        )}
        {result && (
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  )
}
