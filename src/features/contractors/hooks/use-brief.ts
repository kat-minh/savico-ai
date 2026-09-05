'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useRouter } from '@/i18n/navigation'
import { contractorBriefRoute } from '@/shared/constants/routes'
import { isApiError } from '@/shared/lib/api'
import { contractorsApi, type SaveBriefPayload } from '../api/contractors.api'
import { contractorKeys } from '../api/contractors.keys'

/** Hồ sơ dự án đang mở (S10, S11 và header dự án ở S12–S18). */
export function useBrief(projectId: string) {
  return useQuery({
    queryKey: contractorKeys.brief(projectId),
    queryFn: () => contractorsApi.getBrief(projectId),
    enabled: Boolean(projectId)
  })
}

/**
 * "Tạo hồ sơ" ở landing (S09) — sinh mã dự án rồi mở thẳng Bước 1.
 *
 * Hồ sơ được tạo TRƯỚC khi khách nhập gì, giống luồng thiết kế: có mã dự án thì
 * mới lưu nháp được, và mọi màn sau (S12–S18) đều gắn theo mã đó.
 */
export function useCreateBrief() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('errors')

  return useMutation({
    mutationFn: () => contractorsApi.createBrief(),
    onSuccess: (brief) => {
      queryClient.setQueryData(contractorKeys.brief(brief.id), brief)
      router.push(contractorBriefRoute(brief.id))
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.message : t('generic'))
    }
  })
}

/** Lưu Bước 1 — dùng cho cả "Lưu nháp" và "Tiếp tục: Kiểm tra hồ sơ" (S10). */
export function useSaveBrief(projectId: string) {
  const queryClient = useQueryClient()
  const t = useTranslations('errors')

  return useMutation({
    mutationFn: (payload: SaveBriefPayload) => contractorsApi.saveBrief(projectId, payload),
    onSuccess: (brief) => {
      queryClient.setQueryData(contractorKeys.brief(projectId), brief)
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.message : t('generic'))
    }
  })
}

/**
 * "Hoàn tất & tìm nhà thầu" ở Bước 2 (S11). Chốt hồ sơ rồi trả về để lớp app mở
 * popup 3 lựa chọn (R7) — điều hướng tiếp do màn hình quyết định, không phải hook.
 */
export function useCompleteBrief(projectId: string) {
  const queryClient = useQueryClient()
  const t = useTranslations('errors')

  return useMutation({
    mutationFn: () => contractorsApi.completeBrief(projectId),
    onSuccess: (brief) => {
      queryClient.setQueryData(contractorKeys.brief(projectId), brief)
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.message : t('generic'))
    }
  })
}
