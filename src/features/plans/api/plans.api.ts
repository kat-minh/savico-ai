import { env } from '@/shared/config/env'
import { bmtPlansApi } from './plans.bmt'
import { mockPlansApi } from './plans.mock'

/**
 * Chức năng đã nối BMT API — GIỮ MOCK LÀM NỀN. DB backend rỗng nên `listPlans`
 * TỰ VỀ MOCK khi `GET /plans` trả rỗng / lỗi (xem `plans.bmt.ts`), để trang Bảng
 * giá không bao giờ trống và giao diện đã chốt vẫn chạy với cả mock lẫn API.
 *
 * Đã nối: `listPlans` — gói THIẾT KẾ (`GET /plans?kind=Design`). Thẻ dựng từ API
 * là thẻ GỌN (API thiếu dòng đối tượng phù hợp, nhãn nút, quyền lợi nổi bật,
 * quà tặng có giá trị). Gói GIÁM SÁT vẫn đọc kho CMS (API chỉ có tên/giá, thiếu
 * thời hạn / số lượt kiểm tra / quyền lợi cho thẻ giám sát).
 */
const BmtPlansApi = {
  listPlans: bmtPlansApi.listPlans
} satisfies Partial<typeof mockPlansApi>

export const plansApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockPlansApi : { ...mockPlansApi, ...BmtPlansApi }
