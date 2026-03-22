import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import client from '../api/client'
import './AuthPage.css'

export default function ResetPasswordPage() {
  const { uid, token } = useParams()
  const navigate = useNavigate()
  
  const [form, setForm] = useState({ password: '', passwordConfirm: '' })
  const [status, setStatus] = useState({ loading: false, success: '', error: '' })

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (form.password !== form.passwordConfirm) {
      setStatus({ ...status, error: 'Hasła nie są identyczne.' })
      return
    }
    
    setStatus({ loading: true, success: '', error: '' })
    try {
      const res = await client.post('/auth/password_reset_confirm/', { 
        uid, 
        token, 
        password: form.password,
        password_confirm: form.passwordConfirm 
      })
      
      setStatus({ loading: false, success: res.data.message || 'Hasło zmienione pomyślnie!', error: '' })
      setForm({ password: '', passwordConfirm: '' })
      
      // Przekierowanie do logowania po 2 sekundach
      setTimeout(() => {
        navigate('/login')
      }, 2000)
      
    } catch (err) {
      setStatus({ 
        loading: false, 
        success: '', 
        error: err.response?.data?.error || 'Nieprawidłowy lub przeterminowany token.' 
      })
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <span className="auth-icon">🔑</span>
          <h1>Nowe Hasło</h1>
          <p className="text-muted">Ustaw nowe hasło dla swojego konta</p>
        </div>

        {status.error && <div className="alert alert-error">{status.error}</div>}
        {status.success && <div className="alert alert-success">{status.success}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group mb-1">
            <label htmlFor="new-password">Nowe Hasło</label>
            <input
              id="new-password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
              autoFocus
              required
            />
          </div>
          <div className="form-group mb-2">
            <label htmlFor="new-password-confirm">Powtórz Nowe Hasło</label>
            <input
              id="new-password-confirm"
              type="password"
              placeholder="••••••••"
              value={form.passwordConfirm}
              onChange={set('passwordConfirm')}
              autoComplete="new-password"
              required
            />
          </div>
          
          <button
            className="btn btn-primary w-full"
            type="submit"
            disabled={status.loading || status.success}
          >
            {status.loading ? 'Zapisywanie…' : 'Zmień Hasło'}
          </button>
        </form>

        <div className="divider" />
        <p className="text-center text-sm text-muted">
          <Link to="/login">Powrót do logowania</Link>
        </p>
      </div>
    </div>
  )
}
