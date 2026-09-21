import { setRequestLocale } from 'next-intl/server'

import { SurveyManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Lịch khảo sát — vận hành gọi xác nhận với khách và nhà thầu (S16, R3). */
export default async function AdminSurveysPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <SurveyManager />
}
