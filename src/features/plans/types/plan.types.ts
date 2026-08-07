/** Mã gói đăng ký (mục VII). */
export type PlanTier = 'basic' | 'advanced' | 'pro'

/** Một gói đăng ký hiển thị trên trang Gói đăng ký (mục VII, Hình 13). */
export interface SubscriptionPlan {
  tier: PlanTier
  /** Giá cho một chu kỳ, đơn vị VND. */
  price: number
  /** Số ngày hiệu lực của gói. */
  periodDays: number
  /** Số lượt thiết kế - dự toán trong kỳ. */
  designCredits: number
  /** Số lượt tra thư viện mẫu trong kỳ. */
  libraryCredits: number
  /**
   * Quyền lợi thêm ngoài hai hạn mức trên — một dòng, do admin soạn
   * (mục X, #4). Ví dụ "Ưu tiên hàng đợi render".
   */
  perk: string
  /** Dòng "Phù hợp: ..." dưới danh sách quyền lợi. */
  audience: string
  /** Thẻ nổi bật giữa trang, gắn badge "Phổ biến". */
  popular?: boolean
}
