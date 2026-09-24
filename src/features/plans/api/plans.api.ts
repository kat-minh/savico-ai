import { env } from '@/shared/config/env'
import { http } from '@/shared/lib/api'
import type { PlanView } from '../types/plan.types'
import { mockPlansApi } from './plans.mock'

/** Plans API surface. Endpoint path is a placeholder until the .NET controller lands. */
const PlansApi = {
  listPlans: () => http.get<PlanView[]>('/plans')
}

export const plansApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockPlansApi : PlansApi
