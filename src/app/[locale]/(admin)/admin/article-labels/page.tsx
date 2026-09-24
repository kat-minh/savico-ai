import { setRequestLocale } from 'next-intl/server'

import { ArticleLabelManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Nhãn bài viết (spec admin #2). */
export default async function AdminArticleLabelsPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ArticleLabelManager />
}
