import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, register } = useAuth()
  const navigate = useNavigate()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setError('') }

  async function handleSubmit() {
    setError('')
    if (!form.email || !form.password) return setError('Email and password are required')
    if (mode === 'register' && !form.name) return setError('Name is required')
    setLoading(true)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register(form.name, form.email, form.password)
      navigate('/dashboard')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏥</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 700, color: 'var(--accent)' }}>FamilyHealth</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Your family's health, organised.</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 8, padding: 3, marginBottom: 22 }}>
            {['login', 'register'].map(m => (
              <button key={m}
                onClick={() => { setMode(m); setError('') }}
                style={{
                  flex: 1, padding: '7px', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: mode === m ? 'var(--surface)' : 'transparent',
                  color: mode === m ? 'var(--accent)' : 'var(--muted)',
                  boxShadow: mode === m ? 'var(--shadow)' : 'none',
                  transition: 'all .15s'
                }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Your Full Name</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Avishek Agarwal" autoFocus />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" autoFocus={mode === 'login'} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          {error && (
            <div style={{ background: 'var(--warn-bg)', color: 'var(--warn)', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }} onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 16 }}>
          Your health data is stored securely on your own server.
        </p>
      </div>
    </div>
  )
}
