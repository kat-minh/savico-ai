'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useRouter } from '@/i18n/navigation'
import { ROLES, useAuthDialogStore, useAuthStore } from '@/shared/auth'
import { ADMIN_ROUTES, ROUTES } from '@/shared/constants/routes'
import { isApiError } from '@/shared/lib/api'
import { authApi } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'
import type { LoginPayload } from '../types/auth.types'

/**
 * Login mutation: calls the backend, seeds the auth store + query cache. After
 * success it resumes any pending gated action (e.g. a gallery download/view) —
 * that case skips the dashboard; otherwise it redirects to `redirectTo` or, by
 * default, the role's home (admins → the admin area, customers → the dashboard).
 * Errors are normalized to {@link ApiError}.
 */
export function useLogin(redirectTo?: string) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  const closeAuthDialog = useAuthDialogStore((s) => s.close)
  const consumePendingAction = useAuthDialogStore((s) => s.consumePendingAction)

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: ({ user }) => {
      setUser(user)
      queryClient.setQueryData(authKeys.currentUser(), user)
      // Consume the pending action BEFORE closing (close() clears it).
      const pending = consumePendingAction()
      closeAuthDialog()
      // A pending gated action (download/view) resumes in place; every other
      // login goes to its redirect target, defaulting to the role's home so
      // admins land in the isolated admin area rather than the customer shell.
      if (pending) pending()
      else if (redirectTo) router.replace(redirectTo)
      else if (user.roles.includes(ROLES.ADMIN)) router.replace(ADMIN_ROUTES.DASHBOARD)
      else router.replace(ROUTES.HOME)
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.message : 'Unable to sign in. Try again.')
    }
  })
}
