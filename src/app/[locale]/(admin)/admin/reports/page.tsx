import { setRequestLocale } from 'next-intl/server'

import { ReportManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Báo cáo vi phạm người dùng gửi. */
export default async function AdminReportsPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ReportManager />
}
