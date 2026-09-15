'use client'

import { useQuery } from '@tanstack/react-query'

import { designApi } from '../api/design.api'
import { designKeys } from '../api/design.keys'

/**
 * Bước 2 — AI phân tích và lập dự toán. The screen shows the waiting state
 * (mục III.3a) while this is pending, then swaps to the result (mục III.3b).
 */
interface UseEstimateOptions {
  /** Read an existing estimate without re-triggering generation/status changes. */
  readOnly?: boolean
  enabled?: boolean
}

export function useEstimate(projectId: string, { readOnly = false, enabled = true }: UseEstimateOptions = {}) {
  return useQuery({
    queryKey: designKeys.estimate(projectId),
    queryFn: () => (readOnly ? designApi.getEstimate(projectId) : designApi.generateEstimate(projectId)),
    enabled: Boolean(projectId) && enabled,
    // The estimate is expensive to produce; never silently re-run it.
    staleTime: Infinity,
    refetchOnWindowFocus: false
  })
}
