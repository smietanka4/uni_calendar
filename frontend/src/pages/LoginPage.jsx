import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPage.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/')
    } catch (err) {
      const data = err.response?.data || {}
      let msg = 'Błąd logowania. Sprawdź dane.'
      if (typeof data === 'object' && data !== null) {
        const messages = []
        for (const val of Object.values(data)) {
          if (Array.isArray(val)) messages.push(...val)
          else if (typeof val === 'string') messages.push(val)
        }
        if (messages.length > 0) msg = messages[0]
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <span className="auth-icon">📅</span>
          <h1>Kalendarz Uczelniany</h1>
          <p className="text-muted">Zaloguj się do swojego konta</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="username">Nazwa użytkownika</label>
            <input
              id="username"
              type="text"
              placeholder="jan.kowalski"
              value={form.username}
              onChange={set('username')}
              autoComplete="username"
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Hasło</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              autoComplete="current-password"
              required
            />
          </div>
          
          {error && <div className="alert alert-error mb-2">{error}</div>}
          <button
            className="btn btn-primary w-full mt-2"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logowanie…' : 'Zaloguj się'}
          </button>
        </form>

        <div className="divider" />
        <p className="text-center text-sm text-muted">
          Nie masz konta?{' '}
          <Link to="/register">Zarejestruj się</Link>
        </p>
        <p className="text-center text-sm text-muted mt-1">
          Zapomniałeś hasła? <Link to="/zapomnialem-hasla">Zresetuj je</Link>
        </p>
      </div>
    </div>
  )
}
