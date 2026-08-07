import { setRequestLocale } from 'next-intl/server'

import { PlanPricing } from '@/features/plans'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Trang Gói đăng ký (mục VII, Hình 13). */
export default async function PlansPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <PlanPricing />
}
