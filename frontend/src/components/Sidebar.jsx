import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../utils/api'
import MemberModal from './MemberModal'

const NAV = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/upload', icon: '📂', label: 'Reports & Upload' },
  { path: '/trends', icon: '📈', label: 'Trends' },
  { path: '/shares', icon: '🔗', label: 'Shared Links' },
  { path: '/database', icon: '🗄️', label: 'Database & Backup' },
]

export default function Sidebar({ members, selectedMember, setSelectedMember, loadMembers, showToast, user, logout, isOpen, setIsOpen }) {
  const location = useLocation()
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)

  async function deleteMember(m) {
    if (!confirm(`Delete ${m.name} and all their reports? This cannot be undone.`)) return
    try {
      await api.deleteMember(m.id)
      showToast(`${m.name} removed`)
      loadMembers()
      if (selectedMember?.id === m.id) setSelectedMember(null)
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  return (
    <>
      <aside style={{
        width: 260,
        background: '#fff',
        borderRight: '1px solid var(--border)',
        position: 'fixed',
        left: isOpen ? 0 : -260,
        top: 0,
        bottom: 0,
        transition: 'left .25s',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>🏥 FamilyHealth</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Personal Health Tracker</div>
          </div>
          <button className="btn btn-icon" onClick={() => setIsOpen(false)} title="Close sidebar" style={{ fontSize: 16 }}>✕</button>
        </div>

        {/* Family Members */}
        <div style={{ padding: '14px 18px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Family Members</span>
            <button className="btn btn-sm btn-primary" onClick={() => { setEditingMember(null); setShowMemberModal(true); }}>+ Add</button>
          </div>
          {members.map(m => (
            <div key={m.id}
              onClick={() => setSelectedMember(m)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                background: selectedMember?.id === m.id ? 'var(--info-bg)' : 'transparent',
                border: selectedMember?.id === m.id ? '1px solid var(--info)' : '1px solid transparent',
                transition: 'all .12s'
              }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', background: m.color || 'var(--accent)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 12, flexShrink: 0
              }}>{m.avatar_initials || m.name[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{m.relationship} · {m.report_count || 0} reports</div>
              </div>
              <div style={{ display: 'flex', gap: 2, opacity: 0, transition: 'opacity .1s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <button className="btn btn-icon btn-sm" onClick={e => { e.stopPropagation(); setEditingMember(m); setShowMemberModal(true); }} title="Edit">✎</button>
                <button className="btn btn-icon btn-sm" onClick={e => { e.stopPropagation(); deleteMember(m); }} title="Delete" style={{ color: 'var(--warn)' }}>🗑</button>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>
              No family members yet.<br />Click "+ Add" to get started.
            </div>
          )}
        </div>

        <hr className="divider" style={{ margin: '4px 0' }} />

        {/* Navigation */}
        <nav style={{ padding: '8px 10px', flex: 1 }}>
          {NAV.map(({ path, icon, label }) => (
            <Link key={path} to={path} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                borderRadius: 8, marginBottom: 2, fontSize: 13, fontWeight: 500,
                background: location.pathname === path ? 'var(--info-bg)' : 'transparent',
                color: location.pathname === path ? 'var(--accent)' : 'var(--text)',
                transition: 'all .12s'
              }}>
                <span>{icon}</span>{label}
              </div>
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 12, flexShrink: 0
          }}>{user?.name?.[0]?.toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Account owner</div>
          </div>
          <button className="btn btn-sm" onClick={logout} title="Logout">⎋</button>
        </div>
      </aside>

      {/* Toggle button when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', top: 16, left: 16, zIndex: 99,
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 16
          }}>☰</button>
      )}

      {showMemberModal && (
        <MemberModal
          member={editingMember}
          onClose={() => { setShowMemberModal(false); setEditingMember(null); }}
          onSave={() => { loadMembers(); setShowMemberModal(false); setEditingMember(null); }}
          showToast={showToast}
        />
      )}
    </>
  )
}
