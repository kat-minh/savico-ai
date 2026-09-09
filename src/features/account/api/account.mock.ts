import type { AuthUser } from '@/shared/auth'
import { MOCK_SESSION_USER_KEY } from '@/shared/auth'
import { mockDelay } from '@/shared/lib/mock'
import type { ApiError } from '@/shared/types'
import { normalizePhone } from '@/shared/utils'
import type { AccountPlan, UpdateProfilePayload } from '../types/account.types'

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
  },

  /**
   * Ghi thẳng vào bản ghi phiên giả mà `features/auth` đọc ở `/auth/me`, chứ
   * không giữ riêng một bản sao: mỗi lần tải lại trang `useCurrentUser` gọi
   * `/auth/me` rồi `setUser`, nên hồ sơ nào không nằm trong bản ghi đó sẽ bị
   * ghi đè ngược lại ngay sau khi F5.
   */
  updateProfile: async (payload: UpdateProfilePayload): Promise<AuthUser> => {
    await mockDelay(400)

    const raw = typeof window !== 'undefined' ? localStorage.getItem(MOCK_SESSION_USER_KEY) : null
    if (!raw) {
      const error: ApiError = { status: 401, message: 'No active session (mock).' }
      throw error
    }

    const phone = payload.phone.trim()
    const user: AuthUser = {
      ...(JSON.parse(raw) as AuthUser),
      name: payload.name.trim(),
      // Bỏ trống ô = xóa số, nên trường `phone` phải BIẾN MẤT chứ không thành
      // chuỗi rỗng — thẻ hồ sơ hiện "Chưa cập nhật" theo `user.phone ?? …`.
      phone: phone === '' ? undefined : normalizePhone(phone)
    }
    localStorage.setItem(MOCK_SESSION_USER_KEY, JSON.stringify(user))
    return user
  }
}
