'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { handbookApi } from '../api/handbook.api'
import { handbookKeys } from '../api/handbook.keys'
import { selectPersonalizedTemplates } from '../services/handbook.service'
import type { HandbookFilter, HandbookTemplateKind } from '../types/handbook.types'

const STATIC_CONTENT_STALE_TIME = 5 * 60 * 1000

/** Toàn bộ mẫu trong thư viện — dùng cho trang Cẩm nang và panel màn chờ. */
export function useHandbookTemplates() {
  return useQuery({
    queryKey: handbookKeys.templates(),
    queryFn: () => handbookApi.listTemplates(),
    staleTime: STATIC_CONTENT_STALE_TIME
  })
}

/** Một mẫu cụ thể — trang chi tiết mẫu bản vẽ 2D / nội thất 3D. */
export function useHandbookTemplate(id: string) {
  return useQuery({
    queryKey: handbookKeys.templateDetail(id),
    queryFn: () => handbookApi.getTemplate(id),
    staleTime: STATIC_CONTENT_STALE_TIME
  })
}

export function useHandbookArticles(topic?: 'architecture' | 'interior') {
  return useQuery({
    queryKey: handbookKeys.articleList(topic ?? 'all'),
    queryFn: () => handbookApi.listArticles(topic),
    staleTime: STATIC_CONTENT_STALE_TIME
  })
}

export function useHandbookArticle(slug: string) {
  return useQuery({
    queryKey: handbookKeys.articleDetail(slug),
    queryFn: () => handbookApi.getArticle(slug),
    staleTime: STATIC_CONTENT_STALE_TIME
  })
}

/** Ba giai đoạn + chủ đề của cẩm nang nền tảng. */
export function useHandbookStages() {
  return useQuery({
    queryKey: handbookKeys.stages(),
    queryFn: () => handbookApi.listStages(),
    staleTime: STATIC_CONTENT_STALE_TIME
  })
}

/**
 * Hạn mức tra cứu thư viện trong ngày.
 *
 * `staleTime: 0` vì đây là số đếm theo tài khoản, không phải nội dung tĩnh —
 * mở lại trang phải thấy số mới nhất.
 */
export function useHandbookQuota() {
  return useQuery({
    queryKey: handbookKeys.quota(),
    queryFn: () => handbookApi.getQuota()
  })
}

/**
 * Năm mẫu cho panel cẩm nang cá nhân hóa (màn chờ Bước 2 và Bước 3).
 *
 * The random pick is memoised on the fetched pool + filter so the cards stay put
 * while the user reads them — re-rolling on every render would make the panel
 * flicker during the progress ticks.
 */
export function usePersonalizedTemplates(filter: HandbookFilter, kind: HandbookTemplateKind) {
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
