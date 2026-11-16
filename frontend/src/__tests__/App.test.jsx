/**
 * Testy komponentu App - routing i renderowanie.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

// Mock pages/components to isolate routing logic
vi.mock('../pages/LoginPage', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}))
vi.mock('../pages/RegisterPage', () => ({
  default: () => <div data-testid="register-page">Register Page</div>
}))
vi.mock('../pages/WeekPage', () => ({
  default: () => <div data-testid="week-page">Week Page</div>
}))
vi.mock('../pages/AllCoursesPage', () => ({
  default: () => <div data-testid="all-courses-page">All Courses</div>
}))
vi.mock('../pages/CalendarsPage', () => ({
  default: () => <div data-testid="calendars-page">Calendars</div>
}))
vi.mock('../pages/AddCoursePage', () => ({
  default: () => <div data-testid="add-course-page">Add Course</div>
}))
vi.mock('../pages/EditCoursePage', () => ({
  default: () => <div data-testid="edit-course-page">Edit Course</div>
}))
vi.mock('../pages/ForgotPasswordPage', () => ({
  default: () => <div data-testid="forgot-password-page">Forgot Password</div>
}))
vi.mock('../pages/ResetPasswordPage', () => ({
  default: () => <div data-testid="reset-password-page">Reset Password</div>
}))
vi.mock('../pages/PublicCalendarPage', () => ({
  default: () => <div data-testid="public-calendar-page">Public Calendar</div>
}))
vi.mock('../pages/FeedPage', () => ({
  default: () => <div data-testid="feed-page">Feed Page</div>
}))
vi.mock('../pages/PrivacyPolicyPage', () => ({
  default: () => <div data-testid="privacy-policy-page">Privacy Policy</div>
}))
vi.mock('../pages/TermsPage', () => ({
  default: () => <div data-testid="terms-page">Terms Page</div>
}))
vi.mock('../components/Navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>
}))

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(document.body).toBeTruthy()
  })

  it('shows login page for unauthenticated users', () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')

    window.history.pushState({}, '', '/login')
    render(<App />)

    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('shows register page at /register', () => {
    localStorage.removeItem('user')
    window.history.pushState({}, '', '/register')
    render(<App />)

    expect(screen.getByTestId('register-page')).toBeInTheDocument()
  })

  it('shows privacy policy page at /polityka-prywatnosci', () => {
    localStorage.removeItem('user')
    window.history.pushState({}, '', '/polityka-prywatnosci')
    render(<App />)

    expect(screen.getByTestId('privacy-policy-page')).toBeInTheDocument()
  })

  it('shows terms page at /regulamin', () => {
    localStorage.removeItem('user')
    window.history.pushState({}, '', '/regulamin')
    render(<App />)

    expect(screen.getByTestId('terms-page')).toBeInTheDocument()
  })
})
