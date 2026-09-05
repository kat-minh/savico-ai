import { setRequestLocale } from 'next-intl/server'

import { PlanPricing } from '@/features/plans'
import type { Locale } from '@/i18n/routing'
import { PlanTabs } from './plan-tabs'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** S01 — Bảng giá gói thiết kế, tab đầu của trang Bảng giá. */
export default async function PlansPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <PlanTabs active='design' />
      <PlanPricing />
    </>
  )
}
