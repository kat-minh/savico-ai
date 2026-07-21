'use client'

import { useMemo } from 'react'
import type { Role } from '../auth.constants'
import { useAuthStore } from '../auth.store'

/**
 * Ergonomic read-only view over the auth store plus role helpers.
 * Prefer this in components over reaching into the store directly.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isInitialized = useAuthStore((s) => s.isInitialized)

  return useMemo(() => {
    const roles = user?.roles ?? []
    return {
      user,
      roles,
      isAuthenticated,
      isInitialized,
      hasRole: (role: Role) => roles.includes(role),
      hasAnyRole: (allowed: readonly Role[]) => allowed.some((r) => roles.includes(r))
    }
  }, [user, isAuthenticated, isInitialized])
}
