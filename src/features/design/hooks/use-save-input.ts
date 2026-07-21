'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import { isApiError } from '@/shared/lib/api'
import { designApi } from '../api/design.api'
import { designKeys } from '../api/design.keys'
import type { DesignInput } from '../types/design.types'

/**
 * Gửi dữ liệu Bước 1 lên server khi bấm "Nhận dự toán ngay" (mục III.2).
 *
 * Bản nháp autosave nằm ở store phía client để thoát ra vào lại vẫn còn; đây là
 * lần ghi chính thức, và cũng là nguồn địa chỉ cho hồ sơ / link chia sẻ.
 */
export function useSaveInput(projectId: string) {
  const queryClient = useQueryClient()
  const t = useTranslations('errors')

  return useMutation({
    mutationFn: (input: DesignInput) => designApi.saveInput(projectId, input),
    onSuccess: (input) => {
      queryClient.setQueryData(designKeys.input(projectId), input)
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.message : t('generic'))
    }
  })
}
