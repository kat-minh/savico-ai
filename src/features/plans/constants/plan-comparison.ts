import type { PlanTier } from '@/shared/cms'

/**
 * Bảng "So sánh chi tiết 3 gói" (S01).
 *
 * Ô của bảng có ba dạng: `true` (dấu tích), `false` (gạch ngang) hoặc một KHÓA
 * DỊCH cho ô có chữ ("Cơ bản", "2D & 3D nâng cao"...). Giữ ở dạng khóa chứ
 * không phải chữ sẵn để bảng dịch được sang tiếng Anh và admin sửa được qua kho
 * ghi đè `uiStrings` — bảng này là nội dung bán hàng, không phải hằng số kỹ thuật.
 *
 * Mọi khóa đều khai báo thành union: `useTranslations` trong dự án này là bản
 * CÓ KIỂU, chuỗi bất kỳ sẽ không biên dịch — và đó chính là thứ chặn một dòng
 * bảng trỏ vào khóa dịch không tồn tại.
 *
 * Ba dòng của nhóm "Quyền lợi chính" KHÔNG nằm ở đây: số phương án, số lượt sửa
 * và số lượt tra cứu đọc thẳng từ bản ghi gói trong kho nội dung, nên sửa gói ở
 * một chỗ là bảng đổi theo, không phải sửa hai nơi.
 */

/** Khóa dưới `plans.comparison.values` — ô có chữ thay vì tích / gạch. */
export type PlanValueKey =
  | 'layoutBasic'
  | 'layout2d3d'
  | 'layout2d3dPlus'
  | 'estimateRough'
  | 'estimateDetailed'
  | 'estimateOptimized'
  | 'advisoryOnline'
  | 'advisoryPriority'
  | 'advisoryExpert'
  | 'giftValue'
  | 'giftConditionValue'

/** Khóa dưới `plans.comparison.rows`. */
export type PlanRowKey =
  | 'uploadPhoto'
  | 'siteInfo'
  | 'buildingType'
  | 'style'
  | 'layout'
  | 'renderImages'
  | 'structureEstimate'
  | 'finishingEstimate'
  | 'interiorEstimate'
  | 'materialList'
  | 'boq'
  | 'exportDossier'
  | 'contractorPack'
  | 'compareOptions'
  | 'compareCost'
  | 'compareMaterial'
  | 'optimizeBudget'
  | 'costDelta'
  | 'materialAlternatives'
  | 'advisory'
  | 'render3d'
  | 'gift'
  | 'giftCondition'

/** Khóa dưới `plans.comparison.groups`. */
export type PlanGroupKey = 'design' | 'compare' | 'support' | 'proOnly'

/** Giá trị một ô: có / không / một khóa chữ. */
export type PlanCell = boolean | PlanValueKey

export interface PlanComparisonRow {
  key: PlanRowKey
  values: Record<PlanTier, PlanCell>
}

export interface PlanComparisonGroup {
  key: PlanGroupKey
  /** Nhóm dành riêng cho gói cao nhất — tô màu nhấn như bản mô tả. */
  highlight?: boolean
  rows: PlanComparisonRow[]
}

const row = (key: PlanRowKey, basic: PlanCell, advanced: PlanCell, pro: PlanCell): PlanComparisonRow => ({
  key,
  values: { basic, advanced, pro }
})

export const PLAN_COMPARISON: readonly PlanComparisonGroup[] = [
  {
    key: 'design',
    rows: [
      row('uploadPhoto', true, true, true),
      row('siteInfo', true, true, true),
      row('buildingType', true, true, true),
      row('style', true, true, true),
      row('layout', 'layoutBasic', 'layout2d3d', 'layout2d3dPlus'),
      row('renderImages', true, true, true),
      row('structureEstimate', true, true, true),
      row('finishingEstimate', true, true, true),
      row('interiorEstimate', 'estimateRough', 'estimateDetailed', 'estimateOptimized'),
      row('materialList', true, true, true),
      row('boq', true, true, true),
      row('exportDossier', true, true, true),
      row('contractorPack', true, true, true)
    ]
  },
  {
    key: 'compare',
    rows: [
      row('compareOptions', false, true, true),
      row('compareCost', false, true, true),
      row('compareMaterial', false, true, true),
      row('optimizeBudget', false, false, true),
      row('costDelta', false, false, true),
      row('materialAlternatives', false, false, true)
    ]
  },
  {
    key: 'support',
    rows: [row('advisory', 'advisoryOnline', 'advisoryPriority', 'advisoryExpert'), row('render3d', false, false, true)]
  },
  {
    key: 'proOnly',
    highlight: true,
    rows: [row('gift', false, false, 'giftValue'), row('giftCondition', false, false, 'giftConditionValue')]
  }
]

/**
 * Bảng "Giá trị khách hàng nhận được" (S01) — bốn dòng, mỗi gói một câu.
 * Cũng là khóa dịch vì cùng bản chất nội dung bán hàng.
 */
export type PlanValueRowKey = 'easy' | 'time' | 'budget' | 'ready'

export const PLAN_VALUE_ROWS: readonly PlanValueRowKey[] = ['easy', 'time', 'budget', 'ready']
