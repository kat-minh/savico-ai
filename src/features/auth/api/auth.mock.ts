import type { AuthUser } from '@/shared/auth'
import { ROLES } from '@/shared/auth'
import { MOCK_SESSION_USER_KEY, clearSessionMarker, hasSessionMarker, setSessionMarker } from '@/shared/auth'
import type { ApiError } from '@/shared/types'
import type { LoginPayload, LoginResponse, RegisterPayload } from '../types/auth.types'

/**
 * In-memory / localStorage-backed auth mock for local development WITHOUT a
 * backend. Activated by `NEXT_PUBLIC_USE_MOCK_AUTH=true`.
 *
 * It mimics the real contract: persists a (fake) session so reloads stay
 * logged in, and sets the `bmt.auth` cookie the middleware route-guard checks.
 * Delete this file (and the env flag) once the .NET API is wired up.
 */

/** Any email + a password of 8+ chars logs in as this user. */
const MOCK_USER: AuthUser = {
  id: 'mock-user-1',
  email: 'dev@bmt.local',
  name: 'Dev User',
  phone: '0938 123 456',
  roles: [ROLES.CUSTOMER]
}

/**
 * Pick a role from the email so role-based layouts are testable without a
 * backend: an email containing "admin" → admin, otherwise → customer.
 */
function rolesForEmail(email: string): AuthUser['roles'] {
  return email.toLowerCase().includes('admin') ? [ROLES.ADMIN] : [ROLES.CUSTOMER]
}

/** Simulate network latency so loading states are exercised. */
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

/** Build a value matching the normalized {@link ApiError} shape to throw. */
const apiError = (message: string, status: number): ApiError => ({
  status,
  message
})

export const mockAuthApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    await delay()

    if (!payload.email || payload.password.length < 8) {
      throw apiError('Sai email hoặc mật khẩu (mock).', 401)
    }

    const user: AuthUser = {
      ...MOCK_USER,
      email: payload.email,
      roles: rolesForEmail(payload.email)
    }
    localStorage.setItem(MOCK_SESSION_USER_KEY, JSON.stringify(user))
    setSessionMarker()
    return { user }
  },

  async logout(): Promise<void> {
    await delay(150)
    localStorage.removeItem(MOCK_SESSION_USER_KEY)
    clearSessionMarker()
  },

  async getCurrentUser(): Promise<AuthUser> {
    await delay(150)
    const raw = typeof window !== 'undefined' ? localStorage.getItem(MOCK_SESSION_USER_KEY) : null
    // The session is only valid if BOTH the profile and the cookie exist.
    // Once the cookie expires, drop the stale profile so the client store
    // agrees with the middleware (otherwise login ↔ dashboard redirect loop).
    if (!raw || !hasSessionMarker()) {
      localStorage.removeItem(MOCK_SESSION_USER_KEY)
      throw apiError('No active session (mock).', 401)
    }
    return JSON.parse(raw) as AuthUser
  },

  async register(payload: RegisterPayload): Promise<void> {
    await delay(900)
    if (!payload.email) throw apiError('Email is required (mock).', 400)
  },

  // Bản mock không có tài khoản bắt buộc đổi mật khẩu lần đầu, nên hai hàm này
  // chỉ để khớp giao diện với API thật.
  async changePassword(): Promise<string> {
    await delay(400)
    return 'Password changed (mock).'
  },

  async relogin(email: string): Promise<LoginResponse> {
    await delay(200)
    const raw = localStorage.getItem(MOCK_SESSION_USER_KEY)
    const user = raw ? (JSON.parse(raw) as AuthUser) : { ...MOCK_USER, email }
    return { user: { ...user, mustChangePassword: false } }
  }
}
