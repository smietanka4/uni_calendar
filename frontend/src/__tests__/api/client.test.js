/**
 * Testy klienta API – interceptory, konfiguracja.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'

// Mock axios before importing client
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
  return { default: mockAxios }
})

describe('API Client', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('creates axios instance with correct baseURL', async () => {
    // Re-import to trigger the module
    vi.resetModules()
    const axiosMod = (await import('axios')).default
    await import('../../api/client')

    expect(axiosMod.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: '/api',
      })
    )
  })

  it('sets Content-Type header to application/json', async () => {
    vi.resetModules()
    const axiosMod = (await import('axios')).default
    await import('../../api/client')

    expect(axiosMod.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    )
  })

  it('registers request and response interceptors', async () => {
    vi.resetModules()
    const axiosMod = (await import('axios')).default
    await import('../../api/client')

    expect(axiosMod.interceptors.request.use).toHaveBeenCalled()
    expect(axiosMod.interceptors.response.use).toHaveBeenCalled()
  })
})
