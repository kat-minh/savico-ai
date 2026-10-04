'use client'

import { useQuery } from '@tanstack/react-query'
import { env } from '@/shared/config/env'
import { getContractorFilterOptions, type ContractorSearchFilters } from '@/shared/contractors'

import { contractorsApi } from '../api/contractors.api'
import { contractorKeys } from '../api/contractors.keys'

/** Danh sách nhà thầu đề xuất cho một hồ sơ dự án (S12). */
export function useContractors(projectId: string, filters: ContractorSearchFilters = {}) {
  return useQuery({
    queryKey: contractorKeys.list(projectId, filters),
    queryFn: ({ signal }) => contractorsApi.listContractors(projectId, filters, signal),
    enabled: Boolean(projectId)
  })
}

/**
 * Chi tiết một dự án của nhà thầu (hộp thoại dự án ở S13). `data` là `null` khi không có gì để bổ sung
 * (dự án mock, 404, lỗi mạng) — giao diện giữ dữ liệu thẻ. Không retry: 404 là câu trả lời.
 */
export function useContractorProject(contractorId: string, projectId: string) {
  return useQuery({
    queryKey: contractorKeys.project(contractorId, projectId),
    queryFn: () => contractorsApi.getContractorProject(contractorId, projectId),
    enabled: Boolean(contractorId && projectId),
    staleTime: 5 * 60 * 1000,
    retry: false
  })
}

/** Hồ sơ một nhà thầu — dùng chung cho cả 4 tab (S13, S14). */
export function useContractor(contractorId: string) {
  return useQuery({
    queryKey: contractorKeys.detail(contractorId),
    queryFn: () => contractorsApi.getContractor(contractorId),
    enabled: Boolean(contractorId),
    retry: false
  })
}

export function useContractorFilterOptions() {
  return useQuery({
    queryKey: [...contractorKeys.all, 'filter-options'],
    queryFn: ({ signal }) => getContractorFilterOptions(signal),
    enabled: !env.NEXT_PUBLIC_USE_MOCK_API
  })
}
