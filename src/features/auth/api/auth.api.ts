import type { AuthUser } from '@/shared/auth'
import { env } from '@/shared/config/env'
import { http } from '@/shared/lib/api'
import type { LoginPayload, LoginResponse } from '../types/auth.types'
import { mockAuthApi } from './auth.mock'

/**
 * Auth feature API surface. Thin functions over the shared HTTP client — no
 * React/state here so they stay unit-testable and reusable by hooks.
 *
 * Endpoint paths are placeholders aligned with a typical .NET auth controller.
 *
 * While there is no backend, set `NEXT_PUBLIC_USE_MOCK_AUTH=true` to route
 * these through an in-browser mock (see {@link mockAuthApi}).
 */
const AuthApi = {
  login: (payload: LoginPayload) => http.post<LoginResponse>('/auth/login', payload),

  logout: () => http.post<void>('/auth/logout'),

  getCurrentUser: () => http.get<AuthUser>('/auth/me')
}

export const authApi = env.NEXT_PUBLIC_USE_MOCK_AUTH ? mockAuthApi : AuthApi
