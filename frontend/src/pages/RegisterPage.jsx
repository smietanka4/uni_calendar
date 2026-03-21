import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPage.css'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '', email: '', password: '', password2: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password2) {
      setError('Hasła nie są identyczne.')
      return
    }
    setLoading(true)
    try {
      await register(form.username, form.email, form.password, form.password2)
      navigate('/')
    } catch (err) {
      const data = err.response?.data || {}
      const msg = data.username?.[0]
        || data.password?.[0]
        || data.password2?.[0]
        || data.email?.[0]
        || data.detail
        || 'Błąd rejestracji.'
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
          <p className="text-muted">Utwórz nowe konto</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="reg-username">Nazwa użytkownika</label>
            <input
              id="reg-username"
              type="text"
              placeholder="jan.kowalski"
              value={form.username}
              onChange={set('username')}
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="reg-email">E-mail</label>
            <input
              id="reg-email"
              type="email"
              placeholder="jan@uczelnia.pl"
              value={form.email}
              onChange={set('email')}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-password">Hasło</label>
              <input
                id="reg-password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-password2">Powtórz hasło</label>
              <input
                id="reg-password2"
                type="password"
                placeholder="••••••••"
                value={form.password2}
                onChange={set('password2')}
                required
              />
            </div>
          </div>
          <button
            className="btn btn-primary w-full mt-2"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Rejestrowanie…' : 'Zarejestruj się'}
          </button>
        </form>

        <div className="divider" />
        <p className="text-center text-sm text-muted">
          Masz już konto? <Link to="/login">Zaloguj się</Link>
        </p>
      </div>
    </div>
  )
}
