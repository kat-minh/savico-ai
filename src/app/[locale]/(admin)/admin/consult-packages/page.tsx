import { setRequestLocale } from 'next-intl/server'

import { ConsultPackageManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Gói tư vấn 1:1 — danh mục bán hàng, đủ CRUD. */
export default async function AdminConsultPackagesPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ConsultPackageManager />
}
