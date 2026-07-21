import type { AuthUser } from '@/shared/auth'

/** Payload sent to the backend login endpoint. */
export interface LoginPayload {
  email: string
  password: string
  rememberMe?: boolean
}

/**
 * Response from the login endpoint. Tokens are set as httpOnly cookies by the
 * backend, so the body only carries the user profile.
 */
export interface LoginResponse {
  user: AuthUser
}
