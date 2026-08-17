import { setRequestLocale } from 'next-intl/server'

import { ArticleManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Kho bài viết Cẩm nang và Bản tin (mục VI, Phần 3). */
export default async function AdminArticlesPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ArticleManager />
}
