'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useAuthStore } from '@/shared/auth'
import { authApi } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'

/**
 * Fetches the current user (`/auth/me`) and syncs the result into the auth
 * store. Call once near the top of authenticated areas to hydrate session
 * state from the httpOnly cookie.
 */
export function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser)
  const setInitialized = useAuthStore((s) => s.setInitialized)

  const query = useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: authApi.getCurrentUser,
    // Don't hammer the endpoint on a clearly-expired session.
    retry: false,
    staleTime: 5 * 60 * 1000
  })

  useEffect(() => {
    if (query.isSuccess) {
      setUser(query.data)
      setInitialized(true)
    } else if (query.isError) {
      setUser(null)
      setInitialized(true)
    }
  }, [query.isSuccess, query.isError, query.data, setUser, setInitialized])

  return query
}
