/**
 * Testy kontekstu autoryzacji (AuthContext).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../../context/AuthContext'

// Komponent testowy wyświetlający stan auth
function AuthStatus() {
  const { user, logout } = useAuth()
  return (
    <div>
      <div data-testid="user-status">{user ? user.username : 'not-logged-in'}</div>
      <button data-testid="logout-btn" onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null user when no data in localStorage', () => {
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>
    )

    expect(screen.getByTestId('user-status')).toHaveTextContent('not-logged-in')
  })

  it('restores user from localStorage on mount', () => {
    localStorage.setItem('user', JSON.stringify({ username: 'testuser', id: 1 }))

    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>
    )

    expect(screen.getByTestId('user-status')).toHaveTextContent('testuser')
  })

  it('clears user on logout', async () => {
    localStorage.setItem('user', JSON.stringify({ username: 'testuser', id: 1 }))
    localStorage.setItem('access', 'fake-token')
    localStorage.setItem('refresh', 'fake-refresh')

    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>
    )

    expect(screen.getByTestId('user-status')).toHaveTextContent('testuser')

    await act(async () => {
      screen.getByTestId('logout-btn').click()
    })

    expect(screen.getByTestId('user-status')).toHaveTextContent('not-logged-in')
    expect(localStorage.getItem('access')).toBeNull()
    expect(localStorage.getItem('refresh')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<AuthStatus />)
    }).toThrow('useAuth must be used within AuthProvider')

    consoleSpy.mockRestore()
  })

  it('handles corrupted localStorage data gracefully', () => {
    localStorage.setItem('user', 'invalid-json{{{')

    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>
    )

    // Should fallback to null (no crash)
    expect(screen.getByTestId('user-status')).toHaveTextContent('not-logged-in')
  })
})
