'use client'

import { useRouter } from '@/i18n/navigation'
import { ROUTES } from '@/shared/constants/routes'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from '../hooks/use-auth'
import { AuthGuardFallback } from './auth-guard-fallback'

interface GuestRouteProps {
  children: ReactNode
  /** Where to send already-authenticated users. Defaults to the home page. */
  redirectTo?: string
  fallback?: ReactNode
}

/**
 * Guard for guest-only pages (login, register…).
 *
 * Renders its children immediately — guests should see the form without a
 * loading flash — and only redirects once we positively KNOW the visitor is
 * authenticated. While that redirect is in flight we swap in the fallback to
 * avoid a flash of the auth screen.
 */
export function GuestRoute({ children, redirectTo = ROUTES.HOME, fallback }: GuestRouteProps) {
  const { isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()

  const shouldRedirect = isInitialized && isAuthenticated

  useEffect(() => {
    if (shouldRedirect) {
      router.replace(redirectTo)
    }
  }, [shouldRedirect, router, redirectTo])

  if (shouldRedirect) {
    return <>{fallback ?? <AuthGuardFallback />}</>
  }

  return <>{children}</>
}
