import { setRequestLocale } from 'next-intl/server'

import { HomeContentEditor } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Sửa nội dung trang chủ (mục II.2). */
export default async function AdminHomeContentPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <HomeContentEditor />
}
