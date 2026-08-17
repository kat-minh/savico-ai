import { cmsDb } from '@/shared/cms'
import { mockDelay } from '@/shared/lib/mock'
import type { SubscriptionPlan } from '../types/plan.types'

/**
 * Mock của trang Gói đăng ký. Ba gói đọc từ kho `shared/cms` nên admin sửa giá,
 * số lượt hay quyền lợi là bảng giá đổi theo ngay (mục X, #4).
 */
export const mockPlansApi = {
  listPlans: async (): Promise<SubscriptionPlan[]> => {
    await mockDelay(150)
    return cmsDb.list('plans')
  }
}
