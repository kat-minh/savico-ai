import { setRequestLocale } from 'next-intl/server'

import { ContractorLanding } from '@/features/contractors'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** S09 — Landing "Tìm nhà thầu" (trang công khai). */
export default async function ContractorsPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ContractorLanding />
}
