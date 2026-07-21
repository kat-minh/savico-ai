'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import { isApiError } from '@/shared/lib/api'
import { designApi } from '../api/design.api'
import { designKeys } from '../api/design.keys'
import type { Dossier } from '../types/design.types'

/** Trạng thái bộ hồ sơ: chưa render / đang render / đã sẵn sàng (mục III.4). */
export function useDossier(projectId: string) {
  return useQuery({
    queryKey: designKeys.dossier(projectId),
    queryFn: () => designApi.getDossier(projectId),
    enabled: Boolean(projectId)
  })
}

/** Bấm "Render hồ sơ" → màn chờ render → trạng thái hoàn tất. */
export function useRenderDossier(projectId: string) {
  const queryClient = useQueryClient()
  const t = useTranslations('errors')

  return useMutation({
    mutationFn: () => designApi.renderDossier(projectId),
    onSuccess: (dossier) => {
      queryClient.setQueryData(designKeys.dossier(projectId), dossier)
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.message : t('generic'))
    }
  })
}

/**
 * Tạo link chia sẻ xem hồ sơ không cần đăng nhập (mục III.4c). Token trả về
 * được ghi thẳng vào cache bộ hồ sơ để cửa sổ chia sẻ / QR dựng được URL.
 */
export function useCreateShareLink(projectId: string) {
  const queryClient = useQueryClient()
  const t = useTranslations('errors')

  return useMutation({
    mutationFn: () => designApi.createShareLink(projectId),
    onSuccess: ({ token }) => {
      queryClient.setQueryData(designKeys.dossier(projectId), (previous?: Dossier) =>
        previous ? { ...previous, shareToken: token } : previous
      )
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.message : t('generic'))
    }
  })
}

/** Gửi bộ hồ sơ qua email (mục III.4c). */
export function useSendDossierEmail(projectId: string) {
  const t = useTranslations('errors')

  return useMutation({
    mutationFn: (email: string) => designApi.sendDossierEmail(projectId, email),
    onError: (error) => {
      toast.error(isApiError(error) ? error.message : t('generic'))
    }
  })
}
