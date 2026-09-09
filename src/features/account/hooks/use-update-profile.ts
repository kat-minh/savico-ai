'use client'

import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useAuthStore } from '@/shared/auth'
import { isApiError } from '@/shared/lib/api'
import { accountApi } from '../api/account.api'
import type { UpdateProfilePayload } from '../types/account.types'

/**
 * Lưu hộp thoại "Chỉnh sửa" của thẻ hồ sơ (mục IX, Hình 17).
 *
 * Không đụng tới TanStack Query cache: hồ sơ người dùng không phải một query
 * của feature này mà là state dùng chung ở `shared/auth` — thanh công cụ, hồ sơ
 * PDF và ô SĐT điền sẵn ở Bước 1 đều đọc từ đó, nên ghi thẳng vào store là chỗ
 * duy nhất cần cập nhật để cả app đổi theo ngay.
 */
export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser)
  const t = useTranslations('account.info.editDialog')
  const tErrors = useTranslations('errors')

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => accountApi.updateProfile(payload),
    onSuccess: (user) => {
      setUser(user)
      toast.success(t('success'))
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.message : tErrors('generic'))
    }
  })
}
