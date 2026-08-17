import { setRequestLocale } from 'next-intl/server'

import { TemplateManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Thư viện mẫu 2D/3D của Cẩm nang (mục VI, Phần 2). */
export default async function AdminTemplatesPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <TemplateManager />
}
