import { env } from '@/shared/config/env'
import { mockGuideApi } from './guide.mock'

/**
 * Chức năng đã nối BMT API. Hàm nào API chưa đáp ứng đủ giao diện thì KHÔNG
 * khai ở đây — vẫn chạy bản mock kể cả khi tắt `NEXT_PUBLIC_USE_MOCK_API`
 * (danh sách thiếu gửi BE: `docs/BE_API_GAPS.md`).
 */
const BmtGuideApi = {} satisfies Partial<typeof mockGuideApi>

export const guideApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockGuideApi : { ...mockGuideApi, ...BmtGuideApi }
