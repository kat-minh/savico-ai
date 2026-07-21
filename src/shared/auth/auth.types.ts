import type { Role } from './auth.constants'

/** The authenticated user profile returned by the backend `/me` endpoint. */
export interface AuthUser {
  id: string
  email: string
  name: string
  /** Shown on the account screen (mục IV) and stamped onto the dossier header. */
  phone?: string
  avatarUrl?: string
  roles: Role[]
}

/** Client-side auth state held in the Zustand store. */
export interface AuthState {
  user: AuthUser | null
  /** True once the initial session check has resolved. */
  isInitialized: boolean
  isAuthenticated: boolean
}

export interface AuthActions {
  setUser: (user: AuthUser | null) => void
  setInitialized: (value: boolean) => void
  reset: () => void
}

export type AuthStore = AuthState & AuthActions
