import { setRequestLocale } from 'next-intl/server'

import type { Locale } from '@/i18n/routing'
import { ArticleView } from './article-view'

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>
}

/** Trang bài viết trong Cẩm nang / Tin tức (Phần 3.3). */
export default async function HandbookArticlePage({ params }: PageProps) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  return <ArticleView slug={slug} />
}
