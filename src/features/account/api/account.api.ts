import { env } from '@/shared/config/env'
import { http } from '@/shared/lib/api'
import type { AccountPlan } from '../types/account.types'
import { mockAccountApi } from './account.mock'

/** Account API surface. Endpoint paths are placeholders until the .NET controllers land. */
const AccountApi = {
  /** Gói đăng ký đang dùng; `null` khi khách chưa mua gói (mục IX). */
  getPlan: () => http.get<AccountPlan | null>('/me/plan')
}

export const accountApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockAccountApi : AccountApi
