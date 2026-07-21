'use client'

import type { ReactNode } from 'react'

import { useCurrentUser } from '../hooks/use-current-user'

/**
 * Hydrates the auth store from the session cookie by fetching `/auth/me` once.
 * Mount high in authenticated areas (above route guards) so `isInitialized`
 * is resolved before guards decide to redirect.
 */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  useCurrentUser()
  return <>{children}</>
}
