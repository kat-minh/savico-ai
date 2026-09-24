import { setRequestLocale } from 'next-intl/server'

import { Template3DManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Mẫu nội thất 3D (spec admin #2). */
export default async function AdminTemplates3dPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <Template3DManager />
}
