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
    
    // Uzywamy FormData aby obejsc problem z Chrome Autofill niezmieniającym stanu Reacta
    const formData = new FormData(e.target)
    const submittedUsername = formData.get('username') || form.username
    const submittedEmail = formData.get('email') || form.email
    const submittedPassword = formData.get('password') || form.password
    const submittedPassword2 = formData.get('password2') || form.password2

    if (submittedPassword !== submittedPassword2) {
      setError('Hasła nie są identyczne.')
      return
    }
    setLoading(true)
    try {
      await register(submittedUsername, submittedEmail, submittedPassword, submittedPassword2)
      navigate('/')
    } catch (err) {
      const data = err.response?.data || {}
      let msg = 'Błąd rejestracji. Sprawdź poprawność danych (np. silne hasło).'
      
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
          <p className="text-muted">Utwórz nowe konto</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="reg-username">Nazwa użytkownika</label>
            <input
              id="reg-username"
              name="username"
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
            <label htmlFor="reg-email">E-mail</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              placeholder="jan@uczelnia.pl"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-password">Hasło</label>
              <input
                id="reg-password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-password2">Powtórz hasło</label>
              <input
                id="reg-password2"
                name="password2"
                type="password"
                placeholder="••••••••"
                value={form.password2}
                onChange={set('password2')}
                autoComplete="new-password"
                required
              />
            </div>
          </div>
          
          {error && <div className="alert alert-error mb-2">{error}</div>}
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
