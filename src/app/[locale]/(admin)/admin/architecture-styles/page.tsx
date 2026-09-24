import { setRequestLocale } from 'next-intl/server'

import { StyleManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Phong cách kiến trúc (spec admin #1). */
export default async function AdminArchitectureStylesPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <StyleManager kind='architecture' />
}
