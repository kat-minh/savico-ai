import { setRequestLocale } from 'next-intl/server'

import { ChangeRequestManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Yêu cầu sửa đổi hồ sơ giai đoạn đã khóa do khách gửi (S23, R5). */
export default async function AdminChangeRequestsPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ChangeRequestManager />
}
