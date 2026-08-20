import type { CmsQuotas, SubscriptionPlan } from '../cms.types'

/**
 * Ba gói theo bảng mục VII và Hình 13. Giá và số lượt là số MINH HỌA —
 * Bên A chốt số chính thức, admin sửa được không cần deploy (mục X, #4).
 */
export const PLANS_SEED: SubscriptionPlan[] = [
  {
    id: 'basic',
    tier: 'basic',
    price: 990_000,
    periodDays: 30,
    designCredits: 3,
    libraryCredits: 30,
    perk: 'Tải hồ sơ PDF + Excel đầy đủ',
    audience: 'chủ nhà thử 1-2 phương án'
  },
  {
    id: 'advanced',
    tier: 'advanced',
    price: 1_990_000,
    periodDays: 30,
    designCredits: 7,
    libraryCredits: 100,
    perk: 'Ưu tiên hàng đợi render',
    audience: 'chủ nhà so sánh nhiều phương án',
    popular: true
  },
  {
    id: 'pro',
    tier: 'pro',
    price: 4_990_000,
    periodDays: 30,
    designCredits: 20,
    libraryCredits: 300,
    perk: 'Ưu tiên render · Tư vấn kiến trúc sư ưu tiên',
    audience: 'nhà thầu / môi giới'
  }
]

/**
 * Hạn mức miễn phí & hạn mức theo ngày.
 *
 * Con số lấy đúng từ những chỗ trước đây hardcode: 30/10 tin nhắn chat mỗi ngày
 * (Q&A §2.3.5), 3 lượt tra + 2 lượt xem chi tiết Cẩm nang mỗi ngày. Phần "chưa
 * mua gói" trước không có ở đâu, đặt bằng đúng con số mock đang chạy.
 */
export const QUOTAS_SEED: CmsQuotas = {
  freeDesignCredits: 1,
  freeLibraryCredits: 10,
  chatDailyGuest: 10,
  chatDailyCustomer: 30,
  handbookLookupPerDay: 3,
  handbookDetailPerDay: 3
}
