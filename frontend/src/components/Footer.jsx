import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <span>Uni Calendar &copy; {currentYear}. System organizacji i współdzielenia planów zajęć.</span>
        <nav className="site-footer-links" aria-label="Dokumenty prawne">
          <Link to="/polityka-prywatnosci">Polityka prywatności</Link>
          <Link to="/regulamin">Regulamin (T&amp;C)</Link>
        </nav>
      </div>
    </footer>
  )
}
