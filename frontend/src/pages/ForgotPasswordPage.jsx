import { useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import './AuthPage.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ loading: false, success: '', error: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setStatus({ ...status, error: 'Podaj adres e-mail.' })
      return
    }
    
    setStatus({ loading: true, success: '', error: '' })
    try {
      const { data } = await client.post('/auth/password_reset/', { email })
      setStatus({ loading: false, success: data.message || 'Jeśli konto istnieje, e-mail został wysłany.', error: '' })
      setEmail('')
    } catch (err) {
      setStatus({ 
        loading: false, 
        success: '', 
        error: err.response?.data?.error || 'Wystąpił błąd podczas wysyłania zgłoszenia.' 
      })
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <span className="auth-icon">🔑</span>
          <h1>Reset Hasła</h1>
          <p className="text-muted">Podaj e-mail powiązany z Twoim kontem</p>
        </div>

        {status.error && <div className="alert alert-error">{status.error}</div>}
        {status.success && <div className="alert alert-success">{status.success}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group mb-2">
            <label htmlFor="reset-email">E-mail</label>
            <input
              id="reset-email"
              type="email"
              placeholder="jan@uczelnia.pl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
            />
          </div>
          
          <button
            className="btn btn-primary w-full"
            type="submit"
            disabled={status.loading}
          >
            {status.loading ? 'Wysyłanie…' : 'Wyślij Instrukcje'}
          </button>
        </form>

        <div className="divider" />
        <p className="text-center text-sm text-muted">
          Pamiętasz jednak hasło? <Link to="/login">Zaloguj się</Link>
        </p>
      </div>
    </div>
  )
}
