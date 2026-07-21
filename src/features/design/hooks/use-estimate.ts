'use client'

import { useQuery } from '@tanstack/react-query'

import { designApi } from '../api/design.api'
import { designKeys } from '../api/design.keys'

/**
 * Bước 2 — AI phân tích và lập dự toán. The screen shows the waiting state
 * (mục III.3a) while this is pending, then swaps to the result (mục III.3b).
 */
export function useEstimate(projectId: string) {
  return useQuery({
    queryKey: designKeys.estimate(projectId),
    queryFn: () => designApi.generateEstimate(projectId),
    enabled: Boolean(projectId),
    // The estimate is expensive to produce; never silently re-run it.
    staleTime: Infinity,
    refetchOnWindowFocus: false
  })
}
