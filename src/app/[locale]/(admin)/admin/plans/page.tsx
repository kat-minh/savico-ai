import { setRequestLocale } from 'next-intl/server'

import { PlanManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Gói đăng ký — giá và hạn mức (mục VII, mục X #4). */
export default async function AdminPlansPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <PlanManager />
}
