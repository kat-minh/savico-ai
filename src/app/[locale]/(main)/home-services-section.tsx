'use client'

import { useAccountPlan, usePurchaseHistory } from '@/features/account'
import { HomeServices } from '@/features/landing'
import { useAuth } from '@/shared/auth'

/** App-layer glue for the purchased design package shown on the public home page. */
export function HomeServicesSection() {
  const { isAuthenticated } = useAuth()
  const { data: accountPlan } = useAccountPlan(isAuthenticated)
  const { data: purchases } = usePurchaseHistory(isAuthenticated)

  return (
    <HomeServices
      ownedDesignRemaining={accountPlan?.design.remaining}
      ownsSupervision={isAuthenticated && Boolean(purchases?.supervisionOrderId)}
    />
  )
}
