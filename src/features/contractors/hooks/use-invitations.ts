'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useRouter } from '@/i18n/navigation'
import { contractorInviteSentRoute } from '@/shared/constants/routes'
import { isApiError } from '@/shared/lib/api'
import { contractorsApi } from '../api/contractors.api'
import { contractorKeys } from '../api/contractors.keys'
import type { SurveyBooking } from '../types/contractor.types'

/** Lời mời báo giá đã gửi của dự án (S18) + ô đếm "Đã mời x/3" (R1). */
export function useInvitations(projectId: string) {
  return useQuery({
    queryKey: contractorKeys.invitationList(projectId),
    queryFn: () => contractorsApi.listInvitations(projectId),
    enabled: Boolean(projectId)
  })
}

/** Khung giờ khảo sát của một nhà thầu trong một ngày (S16). */
export function useSurveySlots(contractorId: string, date: string) {
  return useQuery({
    queryKey: contractorKeys.slots(contractorId, date),
    queryFn: () => contractorsApi.listSlots(contractorId, date),
    enabled: Boolean(contractorId && date)
  })
}

/**
 * "Xác nhận thời gian khảo sát" (S16) → màn Đã gửi lời mời (S17).
 *
 * Nhận MỘT MẢNG booking vì khách có thể mời nhiều nhà thầu trong cùng một lượt
 * từ bảng so sánh (S15); server gộp chúng vào một mã yêu cầu khảo sát.
 */
export function useSendInvitations(projectId: string) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('errors')

  return useMutation({
    mutationFn: (bookings: SurveyBooking[]) => contractorsApi.createInvitations(projectId, bookings),
    onSuccess: ({ request }) => {
      queryClient.invalidateQueries({ queryKey: contractorKeys.invitationList(projectId) })
      queryClient.invalidateQueries({ queryKey: contractorKeys.brief(projectId) })
      router.push(contractorInviteSentRoute(projectId, request.id))
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.message : t('generic'))
    }
  })
}

/** Chi tiết một yêu cầu khảo sát vừa gửi (S17). */
export function useSurveyRequest(requestId: string) {
  return useQuery({
    queryKey: contractorKeys.surveyRequest(requestId),
    queryFn: () => contractorsApi.getSurveyRequest(requestId),
    enabled: Boolean(requestId)
  })
}

/** Đánh giá nhà thầu đã gửi của dự án (S18). */
export function useContractorReviews(projectId: string) {
  return useQuery({
    queryKey: contractorKeys.reviewList(projectId),
    queryFn: () => contractorsApi.listReviews(projectId),
    enabled: Boolean(projectId)
  })
}

/**
 * Gửi đánh giá cho một lời mời đã hoàn tất (S09: "chỉ khách đã làm việc qua
 * SAVICO mới được đánh giá").
 */
export function useSubmitContractorReview(projectId: string) {
  const queryClient = useQueryClient()
  const t = useTranslations('contractors.rating')

  return useMutation({
    mutationFn: ({ invitationId, rating, comment }: { invitationId: string; rating: number; comment: string }) =>
      contractorsApi.submitReview(invitationId, rating, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractorKeys.reviewList(projectId) })
      toast.success(t('sent'))
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.message : t('failed'))
    }
  })
}
