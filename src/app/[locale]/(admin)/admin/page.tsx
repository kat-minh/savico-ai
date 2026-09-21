import { setRequestLocale } from 'next-intl/server'

import { AdminInbox } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Tổng quan khu quản trị — hàng đợi việc cần xử lý hôm nay. */
export default async function AdminDashboardPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <AdminInbox />
}
