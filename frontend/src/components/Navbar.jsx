import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import useStomp from '../hooks/useStomp'
import './Navbar.css'

const NAV_ICONS = {
  week: (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="3" width="12" height="11" rx="1" />
      <line x1="2" y1="6.5" x2="14" y2="6.5" />
      <line x1="5" y1="1.5" x2="5" y2="4" />
      <line x1="11" y1="1.5" x2="11" y2="4" />
    </svg>
  ),
  feed: (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2.5" y="3" width="11" height="10" rx="1" />
      <line x1="5" y1="6" x2="11" y2="6" />
      <line x1="5" y1="8.5" x2="11" y2="8.5" />
      <line x1="5" y1="11" x2="8.5" y2="11" />
    </svg>
  ),
  list: (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <line x1="2.5" y1="4" x2="13.5" y2="4" />
      <line x1="2.5" y1="8" x2="13.5" y2="8" />
      <line x1="2.5" y1="12" x2="13.5" y2="12" />
    </svg>
  ),
  groups: (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="6" cy="5.5" r="2.2" />
      <path d="M2 13c0-2.1 1.8-3.5 4-3.5s4 1.4 4 3.5" />
      <circle cx="11.5" cy="6" r="1.7" />
      <path d="M10.5 13c.3-1.5 1.5-2.6 3.2-2.6" />
    </svg>
  ),
  add: (
    <svg className="icon-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <line x1="8" y1="3" x2="8" y2="13" />
      <line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  ),
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { messages } = useStomp(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (messages && messages.length > 0) {
      const latest = messages[messages.length - 1]
      if (latest.type === 'TEMPLATE_UPDATED') {
        setToast(latest.payload)
        setTimeout(() => setToast(null), 8000)
      }
    }
  }, [messages])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  const navItems = [
    { to: '/',          label: 'Tydzień',   icon: NAV_ICONS.week },
    { to: '/feed',      label: 'Feed',      icon: NAV_ICONS.feed },
    { to: '/wszystkie', label: 'Wszystkie', icon: NAV_ICONS.list },
    { to: '/grupy',     label: 'Plany',     icon: NAV_ICONS.groups },
    { to: '/dodaj',     label: 'Dodaj',     icon: NAV_ICONS.add },
  ]

  return (
    <nav className="navbar" aria-label="Główna nawigacja">
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'var(--surface-2)',
            color: 'var(--text-bright)',
            border: '1px solid var(--primary)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            zIndex: 9999,
            boxShadow: 'var(--shadow-md)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
          }}
        >
          {toast}
        </div>
      )}

      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-mark">UC</span>
          <span className="brand-text">Uni Calendar</span>
        </Link>

        <div className="navbar-blocks">
          {navItems.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`nav-block${pathname === to ? ' active' : ''}`}
            >
              {icon}
              <span className="nav-block-label">{label}</span>
            </Link>
          ))}
        </div>

        <div className="navbar-user">
          <div className="user-chip">
            <span className="user-avatar">{user.username[0].toUpperCase()}</span>
            <span className="user-name">{user.username}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Wyloguj
          </button>
        </div>
      </div>
    </nav>
  )
}
