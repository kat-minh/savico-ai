'use client'

import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'

import { env } from '@/shared/config/env'
import { handbookApi } from '../api/handbook.api'
import { handbookKeys } from '../api/handbook.keys'
import { selectPersonalizedTemplates } from '../services/handbook.service'
import { localDayKey, useHandbookQuotaLedger } from '../store/handbook-quota.store'
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
 * Effective lookup quota used by the public template grid.
 *
 * In mock mode the API only exposes the configured daily allowance, so a
 * persisted client ledger supplies consumption/reset behaviour for QA and the
 * frontend demo. With the real API connected, server values stay authoritative
 * and no client-side subtraction is applied.
 */
export function useHandbookLookupQuota() {
  const query = useHandbookQuota()
  const dayKey = useHandbookQuotaLedger((state) => state.dayKey)
  const lookupUsed = useHandbookQuotaLedger((state) => state.lookupUsed)
  const resetForToday = useHandbookQuotaLedger((state) => state.resetForToday)
  const consumeLookup = useHandbookQuotaLedger((state) => state.consumeLookup)
  const mockManaged = env.NEXT_PUBLIC_USE_MOCK_API

  useEffect(() => {
    resetForToday()

    const now = new Date()
    const nextMidnight = new Date(now)
    nextMidnight.setHours(24, 0, 0, 20)
    const timer = window.setTimeout(resetForToday, Math.max(250, nextMidnight.getTime() - now.getTime()))
    return () => window.clearTimeout(timer)
  }, [dayKey, resetForToday])

  const total = query.data?.lookupTotal ?? 0
  const serverRemaining = query.data?.lookupRemaining ?? 0
  const usedToday = mockManaged && dayKey === localDayKey() ? lookupUsed : 0
  const remaining = Math.max(serverRemaining - usedToday, 0)

  const consume = useCallback(() => {
    if (remaining <= 0) return false
    if (!mockManaged) return true
    return consumeLookup(serverRemaining)
  }, [consumeLookup, mockManaged, remaining, serverRemaining])

  return {
    ...query,
    remaining,
    total,
    consume
  }
}

/**
 * Effective detail-view quota for the template detail page.
 *
 * Mock mode persists the set of templates viewed today so revisiting the same
 * template does not consume another credit. With the real API connected the
 * server remains authoritative; this hook never subtracts a second local copy.
 */
export function useHandbookDetailQuota() {
  const query = useHandbookQuota()
  const dayKey = useHandbookQuotaLedger((state) => state.dayKey)
  const detailViewedIds = useHandbookQuotaLedger((state) => state.detailViewedIds)
  const resetForToday = useHandbookQuotaLedger((state) => state.resetForToday)
  const consumeDetail = useHandbookQuotaLedger((state) => state.consumeDetail)
  const mockManaged = env.NEXT_PUBLIC_USE_MOCK_API

  useEffect(() => {
    resetForToday()
  }, [dayKey, resetForToday])

  const total = query.data?.detailTotal ?? 0
  const serverRemaining = query.data?.detailRemaining ?? 0
  const viewedTodayIds = useMemo(
    () => (mockManaged && dayKey === localDayKey() ? detailViewedIds : {}),
    [dayKey, detailViewedIds, mockManaged]
  )
  const remaining = Math.max(serverRemaining - Object.keys(viewedTodayIds).length, 0)

  const hasViewed = useCallback((templateId: string) => Boolean(viewedTodayIds[templateId]), [viewedTodayIds])

  const consume = useCallback(
    (templateId: string) => {
      if (hasViewed(templateId)) return 'seen' as const
      if (remaining <= 0) return 'blocked' as const
      if (!mockManaged) return 'consumed' as const
      return consumeDetail(templateId, serverRemaining)
    },
    [consumeDetail, hasViewed, mockManaged, remaining, serverRemaining]
  )

  return {
    ...query,
    remaining,
    total,
    hasViewed,
    consume
  }
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
