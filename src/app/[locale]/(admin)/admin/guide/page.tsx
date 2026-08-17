import { setRequestLocale } from 'next-intl/server'

import { GuideManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Video và bài hướng dẫn của trang Hướng dẫn (mục VI). */
export default async function AdminGuidePage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <GuideManager />
}
