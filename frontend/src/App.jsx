import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { api } from './utils/api'
import Sidebar from './components/Sidebar'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import TrendsPage from './pages/TrendsPage'
import DatabasePage from './pages/DatabasePage'
import SharesPage from './pages/SharesPage'
import Toast from './components/Toast'

export default function App() {
  const { user, logout } = useAuth()
  const [members, setMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [toast, setToast] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  function showToast(msg, type = 'default') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    try {
      const data = await api.getMembers()
      setMembers(data)
      if (data.length > 0 && !selectedMember) setSelectedMember(data[0])
    } catch (e) {
      showToast('Failed to load family members', 'error')
    }
  }

  const sharedProps = {
    members, selectedMember, setSelectedMember,
    loadMembers, showToast, user
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        members={members}
        selectedMember={selectedMember}
        setSelectedMember={setSelectedMember}
        loadMembers={loadMembers}
        showToast={showToast}
        user={user}
        logout={logout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <div style={{
        flex: 1,
        marginLeft: sidebarOpen ? 260 : 0,
        transition: 'margin-left .25s',
        minWidth: 0
      }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage {...sharedProps} />} />
          <Route path="/upload" element={<UploadPage {...sharedProps} />} />
          <Route path="/trends" element={<TrendsPage {...sharedProps} />} />
          <Route path="/database" element={<DatabasePage showToast={showToast} />} />
          <Route path="/shares" element={<SharesPage {...sharedProps} />} />
        </Routes>
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
