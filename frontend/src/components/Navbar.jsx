import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import useStomp from '../hooks/useStomp'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { messages } = useStomp(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (messages && messages.length > 0) {
      const latest = messages[messages.length - 1];
      if (latest.type === 'TEMPLATE_UPDATED') {
        setToast(latest.payload);
        setTimeout(() => setToast(null), 8000);
      }
    }
  }, [messages]);

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`nav-link${pathname === to ? ' active' : ''}`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="navbar">
      {toast && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px',
          background: '#8b5cf6', color: 'white', padding: '1rem',
          borderRadius: '8px', zIndex: 9999, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {toast}
        </div>
      )}
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">📅</span>
          <span>Kalendarz Uczelniany</span>
        </Link>

        <div className="navbar-links">
          {navLink('/', 'Tydzień')}
          {navLink('/wszystkie', 'Wszystkie')}
          {navLink('/feed', 'Feed')}
          {navLink('/grupy', 'Plany')}
          {navLink('/dodaj', '+ Dodaj')}
        </div>

        <div className="navbar-user">
          <span className="user-badge">{user.username}</span>
          {user.is_staff && (
            <a
              href="/django-admin/"
              className="btn btn-ghost btn-sm"
              target="_blank"
              rel="noreferrer"
            >
              Admin
            </a>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Wyloguj
          </button>
        </div>
      </div>
    </nav>
  )
}
