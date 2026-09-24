import { setRequestLocale } from 'next-intl/server'

import { ContractorDetail } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale; id: string }>
}

/** Chi tiết nhà thầu (epic ContractorManagement §2). */
export default async function AdminContractorsIdPage({ params }: PageProps) {
  const { locale, id } = await params
  setRequestLocale(locale)

  return <ContractorDetail id={id} />
}
