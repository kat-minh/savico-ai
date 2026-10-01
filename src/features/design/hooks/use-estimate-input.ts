'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { isApiError } from '@/shared/lib/api'
import { estimateInputApi, type EstimateDetail } from '../api/estimate-input.api'
import { designKeys } from '../api/design.keys'
import {
  applyBuildingType,
  changedFields,
  draftFromInput,
  inputBody,
  missingFields,
  normalizeSaved,
  type EstimateInputBody,
  type EstimateInputDraft
} from '../services/estimate-input.logic'

/** Chờ sau lần gõ cuối rồi mới lưu (BR-PROJ-003 khoản 3: tự lưu, không có nút Lưu nháp). */
const AUTOSAVE_DELAY_MS = 800
const STATIC_STALE = 60 * 60 * 1000

/**
 * - `idle`: chưa có thay đổi · `pending`: có thay đổi chưa gửi · `saving`: đang chờ BE xác nhận
 * - `saved`: BE xác nhận (chỉ báo "đã lưu" sau khi BE trả thành công, BR-PROJ-003 khoản 8)
 * - `error`: lưu hỏng (mạng / máy chủ) — nội dung vẫn giữ, có Thử lại và tự thử khi có mạng
 * - `denied`: BE từ chối vì quyền / gói / lượt / đang khoá đầu vào — không tự thử lại (khoản 7 phần Except)
 */
export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error' | 'denied'

/** Vì sao form không sửa được (BR-PROJ-005: AI đang chạy hoặc đã có kết quả thì khoá đầu vào). */
export type LockReason = 'noEdit' | 'generating' | 'generated' | null

const GENERATING_STATES = ['Pending', 'Processing']

function lockReasonOf(detail: EstimateDetail | undefined, deniedCode: string | null): LockReason {
  if (deniedCode === 'GenerationInProgress') return 'generating'
  if (deniedCode === 'EstimateAlreadyGenerated') return 'generated'
  if (!detail) return null
  if (detail.state === 'Succeeded') return 'generated'
  if (GENERATING_STATES.includes(detail.state)) return 'generating'
  return detail.canEdit === false ? 'noEdit' : null
}

/**
 * Bước 1 của bản dự toán THẬT: đọc bản (`GET /estimates/{id}`), danh mục ghim, tỉnh/xã; giữ bản đang nhập trong
 * state; tự lưu bằng `PUT /estimates/{id}/input`.
 *
 * Mỗi lần lưu gửi ĐỦ mọi trường kèm `changedFields` = trường khác bản đã lưu. Các lần lưu chạy NỐI TIẾP (mỗi lần
 * tăng `inputVersion`), gặp `InputVersionConflict` thì đọc lại phiên bản rồi thử đúng một lần nữa.
 */
export function useEstimateInput(projectId: string) {
  const queryClient = useQueryClient()

  const detail = useQuery({
    queryKey: designKeys.estimateDetail(projectId),
    queryFn: () => estimateInputApi.getEstimate(projectId),
    staleTime: Infinity,
    refetchOnWindowFocus: false
  })
  const catalog = useQuery({
    queryKey: designKeys.estimateCatalog(projectId),
    queryFn: () => estimateInputApi.getCatalog(projectId),
    staleTime: STATIC_STALE
  })
  const provinces = useQuery({
    queryKey: [...designKeys.locations(), 'provinces'],
    queryFn: () => estimateInputApi.listProvinces(),
    staleTime: STATIC_STALE,
    // Nguồn địa chỉ của BE có thể chưa sẵn sàng (503): báo ngay kèm nút Tải lại thay vì để ô chọn quay mãi.
    retry: false
  })

  const [draft, setDraft] = useState<EstimateInputDraft | null>(null)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [deniedCode, setDeniedCode] = useState<string | null>(null)

  const draftRef = useRef<EstimateInputDraft | null>(null)
  const savedRef = useRef<EstimateInputBody | null>(null)
  const versionRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const chainRef = useRef<Promise<boolean>>(Promise.resolve(true))
  const deniedRef = useRef(false)

  // Nạp bản đã lưu vào form MỘT lần; sau đó form là nguồn sự thật, server chỉ xác nhận.
  useEffect(() => {
    if (!detail.data || draftRef.current) return
    const initial = draftFromInput(detail.data.input)
    draftRef.current = initial
    savedRef.current = normalizeSaved(detail.data.input)
    versionRef.current = detail.data.inputVersion
    setDraft(initial)
  }, [detail.data])

  const wardsProvince = draft?.provinceCode ?? null
  const datasetVersion = provinces.data?.datasetVersion ?? null
  const wards = useQuery({
    queryKey: [...designKeys.locations(), 'wards', wardsProvince, datasetVersion],
    queryFn: () => estimateInputApi.listWards(wardsProvince as string, datasetVersion as string),
    enabled: Boolean(wardsProvince && datasetVersion),
    staleTime: STATIC_STALE
  })

  /**
   * Lưu phần khác bản đã lưu, lặp cho tới khi không còn gì chưa lưu (người dùng gõ tiếp trong lúc lưu thì lưu nối
   * tiếp). Trả `true` nếu đã lưu hết.
   */
  const saveAll = useCallback(async (): Promise<boolean> => {
    let retried = false
    for (;;) {
      const current = draftRef.current
      const saved = savedRef.current
      if (!current || !saved || deniedRef.current) return !deniedRef.current
      const changed = changedFields(saved, current)
      if (changed.length === 0) {
        setStatus((previous) => (previous === 'idle' ? previous : 'saved'))
        return true
      }

      const body = inputBody(current)
      setStatus('saving')
      try {
        const result = await estimateInputApi.saveInput(projectId, {
          expectedInputVersion: versionRef.current,
          changedFields: changed,
          input: body
        })
        savedRef.current = body
        versionRef.current = result.savedInputVersion
        setErrorMessage(null)
        retried = false
        // Vòng sau kiểm lại: còn khác bản vừa lưu thì lưu tiếp, hết thì báo "Đã lưu".
      } catch (error) {
        if (isApiError(error)) {
          if (error.messageCode === 'InputVersionConflict' && !retried) {
            const fresh = await estimateInputApi.getEstimate(projectId)
            savedRef.current = normalizeSaved(fresh.input)
            versionRef.current = fresh.inputVersion
            queryClient.setQueryData(designKeys.estimateDetail(projectId), fresh)
            retried = true
            continue
          }
          // Quyền / gói / lượt / đang khoá: không tự thử lại để vượt khoá (BR-PROJ-003 phần Except).
          const locked =
            error.messageCode === 'GenerationInProgress' || error.messageCode === 'EstimateAlreadyGenerated'
          if (error.status === 403 || locked) {
            deniedRef.current = true
            setDeniedCode(error.messageCode ?? 'AccessForbidden')
            setErrorMessage(error.message)
            setStatus('denied')
            return false
          }
          setErrorMessage(error.message)
        } else {
          setErrorMessage(null)
        }
        setStatus('error')
        return false
      }
    }
  }, [projectId, queryClient])

  /** Xếp hàng một lượt lưu sau các lượt đang chạy (không bao giờ có hai PUT cùng lúc). */
  const enqueueSave = useCallback((): Promise<boolean> => {
    chainRef.current = chainRef.current.then(saveAll, saveAll)
    return chainRef.current
  }, [saveAll])

  const scheduleSave = useCallback(
    (delay: number = AUTOSAVE_DELAY_MS) => {
      if (deniedRef.current) return
      if (timerRef.current) window.clearTimeout(timerRef.current)
      setStatus('pending')
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null
        void enqueueSave()
      }, delay)
    },
    [enqueueSave]
  )

  /** Lưu NGAY phần còn dở (trước khi sang bước sau). Trả `true` khi đã lưu hết. */
  const flush = useCallback((): Promise<boolean> => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    return enqueueSave()
  }, [enqueueSave])

  // Mất mạng → có mạng lại thì tự thử lưu (BR-PROJ-003 khoản 7).
  useEffect(() => {
    const onOnline = () => {
      if (status === 'error') void flush()
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [flush, status])

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    },
    []
  )

  const update = useCallback(
    (next: EstimateInputDraft) => {
      draftRef.current = next
      setDraft(next)
      scheduleSave()
    },
    [scheduleSave]
  )

  const patch = useCallback(
    (partial: Partial<EstimateInputDraft>) => {
      if (draftRef.current) update({ ...draftRef.current, ...partial })
    },
    [update]
  )

  const chooseBuildingType = useCallback(
    (buildingTypeId: string) => {
      if (draftRef.current && catalog.data) update(applyBuildingType(draftRef.current, catalog.data, buildingTypeId))
    },
    [catalog.data, update]
  )

  const chooseProvince = useCallback(
    (provinceCode: string) => {
      patch({ provinceCode, wardCode: null, locationDatasetVersion: provinces.data?.datasetVersion ?? null })
    },
    [patch, provinces.data?.datasetVersion]
  )

  const chooseWard = useCallback(
    (wardCode: string) => {
      patch({ wardCode, locationDatasetVersion: provinces.data?.datasetVersion ?? null })
    },
    [patch, provinces.data?.datasetVersion]
  )

  const missing = useMemo(() => (draft ? missingFields(draft, catalog.data) : []), [catalog.data, draft])

  const lock = lockReasonOf(detail.data, deniedCode)

  return {
    detail,
    catalog,
    provinces,
    wards,
    draft,
    missing,
    status,
    errorMessage,
    lock,
    deniedCode,
    patch,
    chooseBuildingType,
    chooseProvince,
    chooseWard,
    flush,
    retry: flush
  }
}
