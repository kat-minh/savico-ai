import { setRequestLocale } from 'next-intl/server'

import type { Locale } from '@/i18n/routing'
import { GuideView } from './guide-view'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Màn hình 3 — Trang Hướng dẫn (mục II.4). */
export default async function GuidePage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <GuideView />
}
