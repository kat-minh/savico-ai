/**
 * Public API của feature `supervision` — GÓI GIÁM SÁT THI CÔNG (S19–S24).
 *
 * R5 xuyên suốt: 6 giai đoạn cố định, Giám sát xác nhận thì hồ sơ khóa, sau đó
 * chỉ đổi qua yêu cầu sửa đổi được bên kia duyệt.
 */
export { SupervisionDashboard } from './components/supervision-dashboard'
export { SupervisionPricing } from './components/supervision-pricing'
export { SupervisionSummary } from './components/supervision-summary'

export { STAGE_KEYS, STAGE_COUNT } from './constants/supervision.constants'
export { useSupervisionProject } from './hooks/use-supervision'
export type { StageKey, SupervisionProject, SupervisionStage } from './types/supervision.types'
