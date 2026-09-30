'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useCmsCollection } from '@/shared/cms'
import { http } from '@/shared/lib/api'
import type { PagedResult } from '@/shared/types'
import { supervisionKeys } from '../api/supervision.keys'
import {
  mergeApiIntoPackages,
  type BmtSupervisionPlanItem,
  type SupervisionPackageView
} from '../api/supervision.merge'

/** Gói giám sát đã công bố trên BMT API. Lỗi hoặc rỗng → `[]`, trang vẫn đủ dữ liệu mock. */
async function fetchPublishedSupervisionPlans(): Promise<BmtSupervisionPlanItem[]> {
  try {
    const page = await http.get<PagedResult<BmtSupervisionPlanItem>>('/plans', {
      params: { kind: 'Supervision', pageSize: 100 }
    })
    return page.items
  } catch {
    return []
  }
}

/**
 * Các gói giám sát của trang S19 và luồng mua: MOCK (kho CMS) làm nền, BMT API ghi đè
 * từng field nó có (xem `supervision.merge.ts`). Kho CMS đọc đồng bộ nên lần vẽ đầu
 * đã đủ thẻ, dữ liệu API đến sau chỉ đổi những field nó có — không nháy trống.
 */
export function useSupervisionPackages(): SupervisionPackageView[] {
  const base = useCmsCollection('supervisionPackages')
  const { data } = useQuery({
    queryKey: supervisionKeys.packages(),
    queryFn: fetchPublishedSupervisionPlans,
    staleTime: 60_000
  })

  return useMemo(() => mergeApiIntoPackages(base, data ?? []), [base, data])
}
