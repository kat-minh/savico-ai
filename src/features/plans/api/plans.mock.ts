import { cmsDb, cmsSeedOf } from '@/shared/cms'
import { mockDelay } from '@/shared/lib/mock'
import type { SubscriptionPlan } from '../types/plan.types'

/**
 * Mock của trang Gói đăng ký. Ba gói đọc từ kho `shared/cms` nên admin sửa giá,
 * số lượt hay quyền lợi là bảng giá đổi theo ngay (mục X, #4).
 */
export const mockPlansApi = {
  listPlans: async (): Promise<SubscriptionPlan[]> => {
    await mockDelay(150)
    const plans = cmsDb.list('plans')
    // Dữ liệu mock đôi khi còn một bản ghi localStorage rỗng từ lần QA trước.
    // Không để nó làm trang gói trống hoàn toàn: môi trường mock luôn phải có
    // seed BASIC/PLUS/PRO để kiểm thử effect; production không đi qua API này.
    return plans.length ? plans : cmsSeedOf('plans')
  }
}
