import { setRequestLocale } from 'next-intl/server'

import { QuotaEditor } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Hạn mức miễn phí & lượt dùng AI. */
export default async function AdminQuotasPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <QuotaEditor />
}
