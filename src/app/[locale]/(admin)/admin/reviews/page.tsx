import { setRequestLocale } from 'next-intl/server'

import { ReviewManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Review về gói tư vấn — duyệt xong mới hiện công khai. */
export default async function AdminReviewsPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ReviewManager />
}
