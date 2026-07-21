'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import { designInputRoute } from '@/shared/constants/routes'
import { isApiError } from '@/shared/lib/api'
import { designApi, type CreateProjectPayload } from '../api/design.api'
import { designKeys } from '../api/design.keys'
import { useDesignStore } from '../store/design.store'

/** Danh sách "Dự án của tôi" trong Cửa sổ cá nhân (mục IV). */
export function useProjects() {
  return useQuery({
    queryKey: designKeys.projects(),
    queryFn: () => designApi.listProjects()
  })
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: designKeys.project(projectId),
    queryFn: () => designApi.getProject(projectId),
    enabled: Boolean(projectId)
  })
}

/**
 * Modal Tạo dự án (mục III.1): sinh Project ID, lưu vào danh sách dự án của
 * tài khoản và mở ngay màn hình Bước 1 — Nhập liệu.
 */
export function useCreateProject() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const closeCreateDialog = useDesignStore((s) => s.closeCreateDialog)
  const t = useTranslations('errors')

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => designApi.createProject(payload),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: designKeys.projects() })
      closeCreateDialog()
      router.push(designInputRoute(project.id))
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.message : t('generic'))
    }
  })
}
