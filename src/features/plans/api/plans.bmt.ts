import { http } from '@/shared/lib/api'
import type { PagedResult } from '@/shared/types'
import type { PlanBenefits, PlanTier, PlanToggleBenefitKey, SubscriptionPlan } from '@/shared/cms'
import type { PlanView } from '../types/plan.types'
import { mockPlansApi } from './plans.mock'

/**
 * Nối trang Bảng giá (gói THIẾT KẾ) vào BMT API — GIỮ MOCK LÀM NỀN.
 *
 * DB backend đang RỖNG nên `GET /plans` trả `items: []`; khi đó `listPlans` TỰ
 * VỀ MOCK (`mockPlansApi` đọc kho CMS) để demo không bao giờ trống và giao diện
 * đã chốt vẫn chạy. API chỉ mô tả được PHẦN LÕI của gói (mã, tên, ảnh, giá theo
 * offer, hai hạn mức và cờ render 3D) nên thẻ dựng từ API là thẻ GỌN: các phần
 * trang trí API không có (dòng đối tượng phù hợp, nhãn nút, quyền lợi nổi bật,
 * quà tặng có giá trị) để trống — KHÔNG bịa (đã thống nhất với user).
 */

/* ===========================================================================
 * DTO — `GET /plans` (Response.PublishedPlanItem)
 * ======================================================================== */

type BmtOfferKey = 'Month' | 'Year' | 'ConstructionSite'

interface BmtQuotaView {
  code: string
  label: string
  isUnlimited: boolean
  limit?: number | null
}

interface BmtOfferView {
  offerKey: BmtOfferKey
  price: number
  currency: string
  quotas: BmtQuotaView[]
}

interface BmtDisplayBenefitView {
  code: string
  label: string
  enabled: boolean
  displayText: string
  sortOrder: number
}

interface BmtRevisionView {
  id: string
  number: number
  state: string
  name: string
  description: string
  consultationText: string
  coverImageUrl?: string | null
  isHighlighted: boolean
  highlightLabel?: string | null
  giftDescription?: string | null
  giftConditions?: string | null
  publishedAtUtc?: string | null
  offers: BmtOfferView[]
  displayBenefits: BmtDisplayBenefitView[]
}

interface BmtPublishedPlanItem {
  planId: string
  code: string
  kind: 'Design' | 'Supervision'
  revision: BmtRevisionView
}

/* ===========================================================================
 * Map DTO → type UI (SubscriptionPlan / PlanView)
 * ======================================================================== */

/** Suy hạng gói từ mã (chứa BASIC/PLUS/PRO); không nhận ra thì dựa vị trí. */
function tierFromCode(code: string, index: number): PlanTier {
  const upper = code.toUpperCase()
  if (upper.includes('BASIC')) return 'basic'
  if (upper.includes('PLUS') || upper.includes('ADVANCED')) return 'advanced'
  if (upper.includes('PRO')) return 'pro'
  const byIndex: PlanTier[] = ['basic', 'advanced', 'pro']
  return byIndex[index] ?? 'basic'
}

/** Khóa toggle của bảng so sánh, để bật đúng những gì API có. */
const TOGGLE_KEYS: readonly PlanToggleBenefitKey[] = [
  'uploadPhoto',
  'siteInfo',
  'buildingType',
  'style',
  'renderImages',
  'structureEstimate',
  'finishingEstimate',
  'materialList',
  'boq',
  'exportDossier',
  'contractorPack',
  'compareOptions',
  'compareCost',
  'compareMaterial',
  'optimizeBudget',
  'costDelta',
  'materialAlternatives',
  'render3d'
]

/**
 * Bộ quyền lợi mặc định TẮT HẾT — API chỉ có `render3d` + 2 hạn mức, phần còn
 * lại không có dữ liệu nên để tắt thay vì đoán. Bật thêm theo `displayBenefits`
 * mà mã trùng khóa toggle.
 */
function benefitsFrom(displayBenefits: BmtDisplayBenefitView[]): PlanBenefits {
  const toggles = Object.fromEntries(TOGGLE_KEYS.map((key) => [key, { enabled: false }])) as PlanBenefits['toggles']

  for (const benefit of displayBenefits) {
    if (!benefit.enabled) continue
    // Mã API dạng "design.render3d"/"catalog.detail" — khớp theo đoạn cuối.
    const leaf = benefit.code.split('.').pop() ?? benefit.code
    const key = TOGGLE_KEYS.find((toggle) => toggle.toLowerCase() === leaf.toLowerCase())
    if (key) {
      const text = benefit.displayText?.trim()
      toggles[key] = text ? { enabled: true, text } : { enabled: true }
    }
  }

  return {
    toggles,
    layout: { level: 'none' },
    interiorEstimate: { level: 'none' },
    advisory: { level: 'none' }
  }
}

/** Tìm hạn mức theo đoạn mã (design.generate / catalog.detail). */
function quotaLimit(quotas: BmtQuotaView[], ...needles: string[]): number {
  const quota = quotas.find((item) => {
    const code = item.code.toLowerCase()
    return needles.some((needle) => code.includes(needle))
  })
  if (!quota) return 0
  if (quota.isUnlimited) return 0
  return quota.limit ?? 0
}

function mapPlan(item: BmtPublishedPlanItem, index: number): PlanView {
  const revision = item.revision
  // Gói thiết kế: giá theo offer `Month` (chu kỳ mặc định của trang Bảng giá);
  // không thấy offer nào thì lấy offer đầu để thẻ vẫn có giá.
  const offer = revision.offers.find((candidate) => candidate.offerKey === 'Month') ?? revision.offers[0]
  const quotas = offer?.quotas ?? []

  const plan: SubscriptionPlan = {
    id: item.planId,
    tier: tierFromCode(item.code, index),
    code: item.code,
    name: revision.name,
    ...(revision.highlightLabel ? { shortLabel: revision.highlightLabel } : {}),
    ...(revision.isHighlighted ? { popular: true } : {}),
    price: offer?.price ?? 0,
    // API không có dòng "đối tượng phù hợp" và nhãn nút — để trống, thẻ vẫn render.
    fitLine: '',
    imageUrl: revision.coverImageUrl ?? '',
    ctaLabel: '',
    status: 'selling',
    designCredits: quotaLimit(quotas, 'generate', 'design.generate'),
    libraryCredits: quotaLimit(quotas, 'catalog', 'detail', 'library'),
    benefits: benefitsFrom(revision.displayBenefits),
    // API không có cấu trúc "quyền lợi nổi bật" → để trống.
    highlights: [],
    // Quà tặng có mô tả nhưng KHÔNG có giá trị quy đổi → không dựng khối quà (giá
    // trị = 0 sẽ hiện sai). Giữ điều kiện quà để không mất dữ liệu; `giftId` null.
    giftId: null,
    ...(revision.giftConditions ? { giftConditions: revision.giftConditions } : {})
  }

  return plan
}

export const bmtPlansApi = {
  listPlans: async (): Promise<PlanView[]> => {
    try {
      const page = await http.get<PagedResult<BmtPublishedPlanItem>>('/plans', {
        params: { kind: 'Design', pageSize: 100 }
      })
      const items = page.items.filter((item) => item.kind === 'Design')
      // DB rỗng (hoặc lỗi map) → về MOCK để trang Bảng giá không trống.
      if (items.length === 0) return mockPlansApi.listPlans()
      return items.map(mapPlan)
    } catch {
      return mockPlansApi.listPlans()
    }
  }
}
