import { env } from '@/shared/config/env'
import { mockPlansApi } from './plans.mock'

/**
 * Chức năng đã nối BMT API. Hàm nào API chưa đáp ứng đủ giao diện thì KHÔNG
 * khai ở đây — vẫn chạy bản mock kể cả khi tắt `NEXT_PUBLIC_USE_MOCK_API`
 * (danh sách thiếu gửi BE: `docs/BE_API_GAPS.md`).
 */
// Chưa nối: `/plans` thiếu tier, gói phổ biến, ảnh, nút CTA, dòng đối tượng phù hợp, quyền lợi có cấu trúc
// (bảng so sánh), quyền lợi nổi bật và quà tặng; trang Bảng giá (`plan-tabs`) và thanh toán còn đọc kho CMS.
const BmtPlansApi = {} satisfies Partial<typeof mockPlansApi>

export const plansApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockPlansApi : { ...mockPlansApi, ...BmtPlansApi }
