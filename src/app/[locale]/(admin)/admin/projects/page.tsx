import { setRequestLocale } from 'next-intl/server'

import { ProjectManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Dự án khách hàng theo luồng 3 bước (mục III). */
export default async function AdminProjectsPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ProjectManager />
}
