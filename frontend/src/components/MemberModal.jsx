import { useState } from 'react'
import { api } from '../utils/api'

const RELATIONSHIPS = ['Self', 'Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Other']
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function MemberModal({ member, onClose, onSave, showToast }) {
  const [form, setForm] = useState({
    name: member?.name || '',
    gender: member?.gender || '',
    dob: member?.dob || '',
    blood_group: member?.blood_group || '',
    relationship: member?.relationship || 'Self',
  })
  const [loading, setLoading] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.name.trim()) return showToast('Name is required', 'error')
    setLoading(true)
    try {
      if (member) {
        await api.updateMember(member.id, form)
        showToast('Member updated!')
      } else {
        await api.addMember(form)
        showToast('Family member added!')
      }
      onSave()
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">{member ? 'Edit Family Member' : 'Add Family Member'}</div>
            <div className="modal-sub">Enter details for health tracking</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Avishek Agarwal" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Relationship *</label>
              <select className="form-select" value={form.relationship} onChange={e => set('relationship', e.target.value)}>
                {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input className="form-input" type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select className="form-select" value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                <option value="">Unknown</option>
                {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <span className="spinner" /> : (member ? 'Save Changes' : 'Add Member')}
          </button>
        </div>
      </div>
    </div>
  )
}
