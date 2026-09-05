import { setRequestLocale } from 'next-intl/server'

import { ContractorCompare } from '@/features/contractors'
import type { Locale } from '@/i18n/routing'
import { ProtectedRoute } from '@/shared/auth'

interface PageProps {
  params: Promise<{ locale: Locale; projectId: string }>
}

/** S15 — So sánh hồ sơ nhà thầu (năng lực, không có giá — R2). */
export default async function ContractorComparePage({ params }: PageProps) {
  const { locale, projectId } = await params
  setRequestLocale(locale)

  return (
    <ProtectedRoute>
      <ContractorCompare projectId={projectId} />
    </ProtectedRoute>
  )
}
