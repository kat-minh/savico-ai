import { setRequestLocale } from 'next-intl/server'

import { CatalogManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Danh mục loại công trình và kiểu kiến trúc & phong cách (mục X, #6). */
export default async function AdminCatalogPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <CatalogManager />
}
