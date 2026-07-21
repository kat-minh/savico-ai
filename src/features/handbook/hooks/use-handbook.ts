'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { handbookApi } from '../api/handbook.api'
import { handbookKeys } from '../api/handbook.keys'
import { selectPersonalizedTemplates } from '../services/handbook.service'
import type { HandbookFilter, HandbookTemplate } from '../types/handbook.types'

/** Toàn bộ mẫu tham khảo — dùng cho trang Cẩm nang (mục II.3). */
export function useHandbookTemplates() {
  return useQuery({
    queryKey: handbookKeys.templates(),
    queryFn: () => handbookApi.listTemplates(),
    staleTime: 5 * 60 * 1000
  })
}

export function useHandbookArticles(topic?: 'architecture' | 'interior') {
  return useQuery({
    queryKey: handbookKeys.articleList(topic ?? 'all'),
    queryFn: () => handbookApi.listArticles(topic),
    staleTime: 5 * 60 * 1000
  })
}

/**
 * 3 mẫu cho panel cẩm nang cá nhân hóa (màn chờ Bước 2 và Bước 3).
 *
 * The random pick is memoised on the fetched pool + filter so the three cards
 * stay put while the user reads them — re-rolling on every render would make
 * the panel flicker during the progress ticks.
 */
export function usePersonalizedTemplates(filter: HandbookFilter, kind: HandbookTemplate['kind']) {
  const query = useHandbookTemplates()
  const pool = query.data

  const templates = useMemo(() => {
    if (!pool) return []
    return selectPersonalizedTemplates(
      pool.filter((template) => template.kind === kind),
      filter
    )
  }, [pool, filter, kind])

  return { ...query, templates }
}
