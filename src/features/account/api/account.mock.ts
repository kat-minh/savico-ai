import { mockDelay } from '@/shared/lib/mock'
import type { AccountPlan } from '../types/account.types'

/**
 * Gói mẫu cho chế độ mock (mục IX, Hình 17). Số lượt và tên gói thật do admin
 * cấu hình (mục X, #4 và #7); backend trả cùng một nguồn với hạn mức Bước 1 nên
 * hai chỗ luôn khớp nhau.
 */
export const mockAccountApi = {
  getPlan: async (): Promise<AccountPlan | null> => {
    await mockDelay(150)
    return {
      name: 'Gói Nâng cao',
      expiresAt: '2026-08-30T00:00:00.000Z',
      design: { remaining: 5, total: 7 },
      library: { remaining: 86, total: 100 }
    }
  }
}
