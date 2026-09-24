import { setRequestLocale } from 'next-intl/server'

import { StyleManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Phong cách nội thất (spec admin #1). */
export default async function AdminInteriorStylesPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <StyleManager kind='interior' />
}
