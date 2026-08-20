import { setRequestLocale } from 'next-intl/server'

import { RescheduleManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Yêu cầu đổi lịch — duyệt là lịch gốc dời theo. */
export default async function AdminReschedulePage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <RescheduleManager />
}
