import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

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
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">📅</span>
          <span>Kalendarz Uczelniany</span>
        </Link>

        <div className="navbar-links">
          {navLink('/', 'Tydzień')}
          {navLink('/wszystkie', 'Wszystkie')}
          {navLink('/grupy', 'Grupy')}
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
