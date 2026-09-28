import { env } from '@/shared/config/env'
import { bmtGetPlan, bmtUpdateProfile } from './account.bmt'
import { mockAccountApi } from './account.mock'

/**
 * Chức năng đã nối BMT API. Hàm nào API chưa đáp ứng đủ giao diện thì KHÔNG
 * khai ở đây — vẫn chạy bản mock kể cả khi tắt `NEXT_PUBLIC_USE_MOCK_API`
 * (danh sách thiếu gửi BE: `docs/BE_API_GAPS.md`).
 *
 * - `updateProfile` → `GET` + `PUT /users/me`.
 * - `getPlan` → `GET /me/design-subscription` (tư vấn 1:1 miễn phí nên bỏ ô lượt
 *   tư vấn; lượt thiết kế có thể lệch với Bước 1 khi Bước 1 còn mock).
 * - `getPurchaseHistory` giữ mock: giao dịch cần hạng gói cố định (`tier`),
 *   trạng thái hoàn tiền, ghi chú, hóa đơn VAT, gói giám sát; mã đơn dẫn sang
 *   màn thanh toán vẫn đọc đơn mock của `features/checkout`.
 */
const BmtAccountApi = {
  // Hồ sơ là bản ghi phiên đăng nhập: khi auth còn giả (`NEXT_PUBLIC_USE_MOCK_AUTH`)
  // thì không có cookie BMT nào để gọi `/users/me`, nên đi theo mock của auth.
  updateProfile: env.NEXT_PUBLIC_USE_MOCK_AUTH ? mockAccountApi.updateProfile : bmtUpdateProfile,
  // `/me/design-subscription` cần cookie phiên BMT — auth giả thì không có, đi theo mock.
  getPlan: env.NEXT_PUBLIC_USE_MOCK_AUTH ? mockAccountApi.getPlan : bmtGetPlan
} satisfies Partial<typeof mockAccountApi>

export const accountApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockAccountApi : { ...mockAccountApi, ...BmtAccountApi }
