import { env } from '@/shared/config/env'
import { bmtDesignApi } from './design.bmt'
import { mockDesignApi } from './design.mock'

export interface CreateProjectPayload {
  name: string
  description?: string
}

/**
 * Chức năng đã nối BMT API. Hàm nào API chưa đáp ứng đủ giao diện thì KHÔNG
 * khai ở đây — vẫn chạy bản mock kể cả khi tắt `NEXT_PUBLIC_USE_MOCK_API`
 * (danh sách thiếu gửi BE: `docs/BE_API_GAPS.md`).
 *
 * Đã nối: màn "Dự án của tôi" — danh sách (`GET /estimates`) và xóa
 * (`POST /estimates/bulk-delete`). Tạo / nhập liệu / gửi AI vẫn mock.
 */
const BmtDesignApi = {
  listProjects: bmtDesignApi.listProjects,
  deleteProject: bmtDesignApi.deleteProject
} satisfies Partial<typeof mockDesignApi>

export const designApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockDesignApi : { ...mockDesignApi, ...BmtDesignApi }
