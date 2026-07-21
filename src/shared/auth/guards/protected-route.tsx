'use client'

import { usePathname, useRouter } from '@/i18n/navigation'
import { ROUTES } from '@/shared/constants/routes'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from '../hooks/use-auth'
import { AuthGuardFallback } from './auth-guard-fallback'

interface ProtectedRouteProps {
  children: ReactNode
  /** Rendered while the session is being resolved. */
  fallback?: ReactNode
}

/**
 * Client-side guard for authenticated areas. The middleware is the primary
 * gate; this component handles client navigations and renders a fallback
 * during the brief auth-resolution window to prevent UI flicker.
 */
export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      // Login is a popup on the public home, not a page — bounce there and let
      // `?auth=login` auto-open it, preserving the intended target.
      router.replace(`${ROUTES.HOME}?auth=login&redirect=${encodeURIComponent(pathname)}`)
    }
  }, [isInitialized, isAuthenticated, router, pathname])

  if (!isInitialized || !isAuthenticated) {
    return <>{fallback ?? <AuthGuardFallback />}</>
  }

  return <>{children}</>
}
