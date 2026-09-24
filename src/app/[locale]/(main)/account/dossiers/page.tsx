import { setRequestLocale } from 'next-intl/server'

import { AccountDossierList } from '@/features/contractors'
import type { Locale } from '@/i18n/routing'
import { pageMetadata } from '@/shared/lib/page-metadata'

export const generateMetadata = pageMetadata('accountDossiers')

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function AccountDossiersPage({ params }: PageProps) {
  const { locale: localeParam } = await params
  const locale = localeParam as Locale
  setRequestLocale(locale)

  return <AccountDossierList />
}
