/**
 * Kiểu dữ liệu của trang Gói đăng ký (mục VII).
 *
 * Giá và hạn mức do admin cập nhật không cần deploy (mục X, #4) nên type nằm ở
 * `shared/cms`; đây chỉ re-export để barrel của feature không đổi.
 */
export type { PlanTier, SubscriptionPlan } from '@/shared/cms'
