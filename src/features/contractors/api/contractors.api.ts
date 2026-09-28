import { env } from '@/shared/config/env'
import type { Invitation, ProjectBrief, SurveyRequest } from '../types/contractor.types'
import { mockContractorsApi } from './contractors.mock'

/** Dữ liệu ghi xuống khi lưu Bước 1 (S10). */
export type SaveBriefPayload = Omit<ProjectBrief, 'id' | 'createdAt' | 'updatedAt' | 'status'>

/**
 * "Tạo hồ sơ từ gói" (S09, ★ mục 9) — sinh hồ sơ bằng dữ liệu đã có từ dự án
 * thiết kế, bỏ qua Bước 1 nhập liệu thủ công.
 */
export interface CreateBriefFromDesignPayload {
  designProjectId: string
  name: string
  buildingType: string
  landArea: number
}

/** Kết quả màn "Đã gửi lời mời" (S17) — một yêu cầu, tối đa 3 lời mời (R1). */
export interface SurveyRequestDetail {
  request: SurveyRequest
  invitations: Invitation[]
}

/**
 * Chức năng đã nối BMT API. Hàm nào API chưa đáp ứng đủ giao diện thì KHÔNG
 * khai ở đây — vẫn chạy bản mock kể cả khi tắt `NEXT_PUBLIC_USE_MOCK_API`
 * (danh sách thiếu gửi BE: `docs/BE_API_GAPS.md`).
 */
const BmtContractorsApi = {} satisfies Partial<typeof mockContractorsApi>

export const contractorsApi = env.NEXT_PUBLIC_USE_MOCK_API
  ? mockContractorsApi
  : { ...mockContractorsApi, ...BmtContractorsApi }
