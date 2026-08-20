import { setRequestLocale } from 'next-intl/server'

import { SubscriptionManager } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Subscription của người dùng — gia hạn thủ công, hủy. */
export default async function AdminSubscriptionsPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <SubscriptionManager />
}
