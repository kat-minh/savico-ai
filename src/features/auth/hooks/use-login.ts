'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('auth.login')
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
      // Dọn Router Cache trước khi điều hướng: mọi trang đã được prefetch trong
      // phiên khách đều đang giữ payload dựng cho khách. (Riêng nhóm route bắt
      // buộc đăng nhập thì không còn được prefetch nữa — xem `i18n/navigation`.)
      router.refresh()
      // Consume the pending action BEFORE closing (close() clears it).
      const pending = consumePendingAction()
      closeAuthDialog()
      // Tài khoản nhân viên mới bị chặn mọi chức năng cho tới khi đổi mật khẩu
      // (BR-RBAC-006). Đừng đá vào khu quản trị (toàn 403) — màn buộc đổi mật
      // khẩu ở `AuthBootstrap` sẽ hiện đè lên trang hiện tại và lo phần còn lại.
      if (user.mustChangePassword) return
      // Đá theo VAI TRÒ: admin LUÔN về khu quản trị, không rơi vào trang khách
      // dù phiên khách có `redirect`/hành động chờ (vd guest bấm link /account
      // rồi đăng nhập bằng tài khoản admin). Khu admin và khu khách tách biệt.
      if (user.roles.includes(ROLES.ADMIN)) {
        // Trang Tổng quan (`/admin`) đã ẩn khỏi menu → đá về mục đầu sidebar
        // (Đơn hàng) để không rơi vào trang không có trong điều hướng.
        router.replace(ADMIN_ROUTES.ORDERS)
        return
      }
      // Khách: nối lại hành động đang chờ (tải / xem) tại chỗ → đích `redirect`
      // (đều là trang khách) → mặc định trang chủ.
      if (pending) pending()
      else if (redirectTo) router.replace(redirectTo)
      else router.replace(ROUTES.HOME)
    },
    onError: (error) => {
      if (!isApiError(error) || error.status === 0) {
        toast.error(isApiError(error) ? error.message : t('invalid'))
        return
      }
      // The API answers an unknown email with a 500 "User does not exist", so
      // every non-network failure except a lock reads as bad credentials.
      toast.error(error.messageCode === 'AccountLocked' ? t('locked') : t('invalid'))
    }
  })
}
