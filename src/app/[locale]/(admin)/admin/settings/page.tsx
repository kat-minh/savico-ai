import { setRequestLocale } from 'next-intl/server'

import { SiteSettingsEditor } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Cài đặt site: thương hiệu, liên hệ, mạng xã hội, pháp lý, SEO. */
export default async function AdminSettingsPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <SiteSettingsEditor />
}
