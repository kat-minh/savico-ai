import type { CostSection, EstimateResult, EstimateSection } from '../types/design.types'

/**
 * Kết quả dự toán THẬT → mô hình màn hình, và trạng thái tác vụ AI. Logic thuần (không React, không HTTP) để kiểm
 * bằng `node --experimental-strip-types`.
 *
 * `dossier.content` theo HỢP ĐỒNG AI nên đọc phòng thủ. Hợp đồng `mock-v1` (TDD-PROJ-002/003) công bố `isSample`,
 * `notice`, `estimate{currency, sections[key, name, amount], total}` và `consultation`; ba phần `rough`, `finishing`,
 * `interior`. Hợp đồng của AI thật có thể khác (chi tiết hơn) — khi đó chỉ cần sửa file này.
 */

/** Trạng thái bản dự toán gom về bốn nhóm giao diện cần. */
export type EstimateStateKind = 'draft' | 'processing' | 'succeeded' | 'failed'

export function estimateStateKind(state: string | null | undefined): EstimateStateKind {
  switch (state) {
    case 'Succeeded':
      return 'succeeded'
    case 'Processing':
    case 'Pending':
      return 'processing'
    case 'Failed':
    case 'TimedOut':
      return 'failed'
    default:
      return 'draft'
  }
}

/** Bước đang dừng suy từ trạng thái AI: chưa gửi → 1, đang xử lý / thất bại → 2, có kết quả → 3. */
export function stepOfState(state: string | null | undefined): 1 | 2 | 3 {
  const kind = estimateStateKind(state)
  return kind === 'succeeded' ? 3 : kind === 'draft' ? 1 : 2
}

/** Lý do thất bại cho khách (khoá dịch `design.estimateApi.failure.<kind>`). */
export type FailureKind = 'timeout' | 'fileUnavailable' | 'invalidResult' | 'generic'

export function failureKind(code: string | null | undefined): FailureKind {
  switch (code) {
    case 'GenerationTimedOut':
    case 'UsageTimedOut':
      return 'timeout'
    case 'ResultFileUnavailable':
      return 'fileUnavailable'
    case 'InvalidProviderResult':
      return 'invalidResult'
    default:
      return 'generic'
  }
}

/** Lỗi luồng chờ kết quả: chưa gửi AI (về Bước 1) hoặc tác vụ thất bại (kèm mã để hiện lý do + Thử lại). */
export class EstimateFlowError extends Error {
  constructor(
    readonly kind: 'notSubmitted' | 'failed',
    readonly failureCode?: string | null
  ) {
    super(kind)
    this.name = 'EstimateFlowError'
  }
}

/* ===========================================================================
 * Ánh xạ nội dung hồ sơ → EstimateResult
 * ======================================================================== */

const COST_ORDER: readonly CostSection[] = ['structure', 'finishing', 'interior']

/** Khoá phần của hợp đồng → nhóm chi phí trên màn hình. `rough` (phần thô) là kết cấu. */
function costSectionOf(key: string | undefined, index: number): CostSection {
  switch ((key ?? '').toLowerCase()) {
    case 'rough':
    case 'structure':
    case 'shell':
      return 'structure'
    case 'finishing':
    case 'finish':
      return 'finishing'
    case 'interior':
    case 'furniture':
      return 'interior'
    default:
      return COST_ORDER[Math.min(index, COST_ORDER.length - 1)] ?? 'structure'
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Số tiền BE có thể trả dạng số hoặc chuỗi số; hỏng thì 0. */
export function toAmount(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(/[^\d.-]/g, '')) : NaN
  return Number.isFinite(n) ? n : 0
}

function adviceOf(value: unknown): string {
  if (typeof value === 'string') return value
  if (isRecord(value)) {
    for (const key of ['text', 'message', 'summary', 'content']) {
      const found = value[key]
      if (typeof found === 'string') return found
    }
  }
  return ''
}

export interface MapContext {
  projectId: string
  /** Diện tích khách nhập (m²) — AI giả không trả diện tích sàn nên dùng số này. */
  areaM2: number
  /** Lúc tác vụ chốt (ISO). */
  completedAt?: string
  /** Đường dẫn tải Excel (route của BE) nếu đã biết. */
  xlsxUrl?: string
}

export interface MappedResult {
  result: EstimateResult
  /** `true` khi AI báo đây là dữ liệu MẪU (hợp đồng `mock-v1`). */
  isSample: boolean
  /** Ghi chú kèm dữ liệu mẫu. */
  notice: string
}

export function mapEstimateContent(content: unknown, context: MapContext): MappedResult {
  const root = isRecord(content) ? content : {}
  const estimate = isRecord(root.estimate) ? root.estimate : {}
  const rawSections = Array.isArray(estimate.sections) ? estimate.sections : []

  const merged = new Map<CostSection, EstimateSection>()
  rawSections.forEach((raw, index) => {
    if (!isRecord(raw)) return
    const key = typeof raw.key === 'string' ? raw.key : undefined
    const name = typeof raw.name === 'string' ? raw.name : (key ?? '')
    const amount = toAmount(raw.amount)
    const section = costSectionOf(key, index)
    const existing = merged.get(section) ?? { section, items: [], total: 0 }
    existing.items.push({ id: key ?? `${section}-${index}`, label: name, amount, children: [] })
    existing.total += amount
    merged.set(section, existing)
  })

  const sections = COST_ORDER.flatMap((section) => {
    const found = merged.get(section)
    return found ? [found] : []
  })
  const summed = sections.reduce((sum, section) => sum + section.total, 0)
  const total = toAmount(estimate.total)

  return {
    result: {
      projectId: context.projectId,
      sections,
      grandTotal: total > 0 ? total : summed,
      advisory: adviceOf(root.consultation),
      estimatedFloorArea: context.areaM2,
      xlsxUrl: context.xlsxUrl ?? '',
      ...(context.completedAt ? { completedAt: context.completedAt } : {})
    },
    isSample: root.isSample === true,
    notice: typeof root.notice === 'string' ? root.notice : ''
  }
}
