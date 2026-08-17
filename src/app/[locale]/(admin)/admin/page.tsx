import { setRequestLocale } from 'next-intl/server'

import { AdminOverview } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Tổng quan khu quản trị — số liệu đếm trực tiếp từ kho nội dung. */
export default async function AdminDashboardPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <AdminOverview />
}
