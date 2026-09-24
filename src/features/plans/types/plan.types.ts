import type { PlanGift, SubscriptionPlan } from '@/shared/cms'

/**
 * Kiểu dữ liệu của trang Gói đăng ký (mục VII).
 *
 * Gói do admin cấu hình nằm ở `shared/cms`; trang công khai đọc một VIEW của
 * gói — quà tặng đã tra từ Danh mục quà tặng — để component không phải tự ghép.
 */
export type { PlanTier, SubscriptionPlan } from '@/shared/cms'

export type PlanView = SubscriptionPlan & { gift?: PlanGift }
