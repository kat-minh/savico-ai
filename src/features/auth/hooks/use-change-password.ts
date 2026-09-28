'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRouter } from '@/i18n/navigation'
import { ROLES, useAuthStore } from '@/shared/auth'
import { ADMIN_ROUTES, ROUTES } from '@/shared/constants/routes'
import { authApi } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'

interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

/**
 * Đổi mật khẩu cho luồng bắt buộc đổi lần đầu.
 *
 * Backend thu hồi phiên sau khi đổi, nên hook tự đăng nhập lại bằng mật khẩu mới
 * để lấy phiên và hồ sơ mới (khi đó `mustChangePassword` đã tắt), cập nhật store
 * rồi đưa người dùng về trang chủ theo vai trò. Email lấy từ phiên đang đăng
 * nhập nên form chỉ cần mật khẩu cũ và mới.
 */
export function useChangePassword() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const email = useAuthStore((s) => s.user?.email)
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: ChangePasswordInput) => {
      await authApi.changePassword({ currentPassword, newPassword })
      if (!email) throw new Error('Missing session email')
      return authApi.relogin(email, newPassword)
    },
    onSuccess: ({ user }) => {
      setUser(user)
      queryClient.setQueryData(authKeys.currentUser(), user)
      router.replace(user.roles.includes(ROLES.ADMIN) ? ADMIN_ROUTES.DASHBOARD : ROUTES.HOME)
    }
  })
}
