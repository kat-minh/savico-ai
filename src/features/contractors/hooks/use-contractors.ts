'use client'

import { useQuery } from '@tanstack/react-query'

import { contractorsApi } from '../api/contractors.api'
import { contractorKeys } from '../api/contractors.keys'

/** Danh sách nhà thầu đề xuất cho một hồ sơ dự án (S12). */
export function useContractors(projectId: string) {
  return useQuery({
    queryKey: contractorKeys.list(projectId),
    queryFn: () => contractorsApi.listContractors(projectId),
    enabled: Boolean(projectId)
  })
}

/** Hồ sơ một nhà thầu — dùng chung cho cả 4 tab (S13, S14). */
export function useContractor(contractorId: string) {
  return useQuery({
    queryKey: contractorKeys.detail(contractorId),
    queryFn: () => contractorsApi.getContractor(contractorId),
    enabled: Boolean(contractorId)
  })
}
