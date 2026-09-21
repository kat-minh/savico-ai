import { setRequestLocale } from 'next-intl/server'

import { ContractorManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Danh bạ nhà thầu — nhập, xác minh, bật/tắt nhận dự án (S12–S15). */
export default async function AdminContractorsPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ContractorManager />
}
