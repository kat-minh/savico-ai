import { setRequestLocale } from 'next-intl/server'

import { ConsultantManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Hồ sơ kiến trúc sư của trang Tư vấn 1:1 (mục VIII.1). */
export default async function AdminConsultantsPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ConsultantManager />
}
