import { setRequestLocale } from 'next-intl/server'

import { OrderConfirm } from '@/features/checkout'
import type { Locale } from '@/i18n/routing'
import { ProtectedRoute } from '@/shared/auth'

interface PageProps {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ plan?: string; project?: string }>
}

/**
 * S03 — Xác nhận đơn hàng (bước 2/4).
 *
 * `?plan=` là mã gói được chọn ở S01 hoặc S19; có `?project=` nghĩa là đơn gắn
 * với một dự án, tức là mua gói giám sát (R8).
 */
export default async function CheckoutConfirmPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const { plan, project } = await searchParams
  setRequestLocale(locale)

  return (
    <ProtectedRoute>
      <OrderConfirm productId={plan ?? ''} kind={project ? 'supervision' : 'design'} projectId={project} />
    </ProtectedRoute>
  )
}
