import { setRequestLocale } from 'next-intl/server'

import type { Locale } from '@/i18n/routing'
import { ProtectedRoute } from '@/shared/auth'
import { DesignEntry } from './design-entry'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/**
 * Điểm vào mục "Thiết kế & Dự toán" trên thanh công cụ.
 * Chưa có dự án nào đang mở → mở Cửa sổ Tạo dự án (mục III.1).
 */
export default async function DesignPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <ProtectedRoute>
      <DesignEntry />
    </ProtectedRoute>
  )
}
