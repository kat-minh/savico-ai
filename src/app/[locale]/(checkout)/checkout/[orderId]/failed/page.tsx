import { setRequestLocale } from 'next-intl/server'

import { PaymentFailed } from '@/features/checkout'
import type { Locale } from '@/i18n/routing'
import { ProtectedRoute } from '@/shared/auth'

interface PageProps {
  params: Promise<{ locale: Locale; orderId: string }>
}

/** S07 — Chưa nhận được thanh toán. */
export default async function CheckoutFailedPage({ params }: PageProps) {
  const { locale, orderId } = await params
  setRequestLocale(locale)

  return (
    <ProtectedRoute>
      <PaymentFailed orderId={orderId} />
    </ProtectedRoute>
  )
}
