'use client'

import { useAccountPlan } from '@/features/account'
import { HomeServices } from '@/features/landing'
import { useAuth } from '@/shared/auth'

/** App-layer glue for the purchased design package shown on the public home page. */
export function HomeServicesSection() {
  const { isAuthenticated } = useAuth()
  const { data: accountPlan } = useAccountPlan(isAuthenticated)

  return <HomeServices ownedDesignRemaining={accountPlan?.design.remaining} />
}
