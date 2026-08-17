import { setRequestLocale } from 'next-intl/server'

import { PricingManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Bảng đơn giá dự toán theo ba gói hoàn thiện (mục III.3). */
export default async function AdminPricingPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <PricingManager />
}
