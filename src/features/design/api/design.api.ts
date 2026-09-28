import { env } from '@/shared/config/env'
import { mockDesignApi } from './design.mock'

export interface CreateProjectPayload {
  name: string
  description?: string
}

/**
 * Chức năng đã nối BMT API. Hàm nào API chưa đáp ứng đủ giao diện thì KHÔNG
 * khai ở đây — vẫn chạy bản mock kể cả khi tắt `NEXT_PUBLIC_USE_MOCK_API`
 * (danh sách thiếu gửi BE: `docs/BE_API_GAPS.md`).
 */
const BmtDesignApi = {} satisfies Partial<typeof mockDesignApi>

export const designApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockDesignApi : { ...mockDesignApi, ...BmtDesignApi }
