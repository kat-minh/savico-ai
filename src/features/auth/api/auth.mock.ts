import type { AuthUser } from '@/shared/auth'
import { ROLES } from '@/shared/auth'
import { AUTH_COOKIE_NAME } from '@/shared/auth/auth.constants'
import type { ApiError } from '@/shared/types'
import type { LoginPayload, LoginResponse } from '../types/auth.types'

/**
 * In-memory / localStorage-backed auth mock for local development WITHOUT a
 * backend. Activated by `NEXT_PUBLIC_USE_MOCK_AUTH=true`.
 *
 * It mimics the real contract: persists a (fake) session so reloads stay
 * logged in, and sets the `bmt.auth` cookie the middleware route-guard checks.
 * Delete this file (and the env flag) once the .NET API is wired up.
 */

const MOCK_USER_KEY = 'bmt.mock-user'

/** Any email + a password of 8+ chars logs in as this user. */
const MOCK_USER: AuthUser = {
  id: 'mock-user-1',
  email: 'dev@bmt.local',
  name: 'Dev User',
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

function setSessionCookie(): void {
  // Non-httpOnly cookie (the real one is httpOnly, but JS can't set those).
  // The middleware only checks for its presence, not its value.
  document.cookie = `${AUTH_COOKIE_NAME}=mock; path=/; max-age=86400; SameSite=Lax`
}

function clearSessionCookie(): void {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
}

/** Whether the (mock) session cookie is still present. */
function hasSessionCookie(): boolean {
  return (
    typeof document !== 'undefined' &&
    document.cookie.split(';').some((c) => c.trim().startsWith(`${AUTH_COOKIE_NAME}=`))
  )
}

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
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user))
    setSessionCookie()
    return { user }
  },

  async logout(): Promise<void> {
    await delay(150)
    localStorage.removeItem(MOCK_USER_KEY)
    clearSessionCookie()
  },

  async getCurrentUser(): Promise<AuthUser> {
    await delay(150)
    const raw = typeof window !== 'undefined' ? localStorage.getItem(MOCK_USER_KEY) : null
    // The session is only valid if BOTH the profile and the cookie exist.
    // Once the cookie expires, drop the stale profile so the client store
    // agrees with the middleware (otherwise login ↔ dashboard redirect loop).
    if (!raw || !hasSessionCookie()) {
      localStorage.removeItem(MOCK_USER_KEY)
      throw apiError('No active session (mock).', 401)
    }
    return JSON.parse(raw) as AuthUser
  }
}
