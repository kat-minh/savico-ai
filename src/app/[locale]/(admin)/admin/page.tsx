import { setRequestLocale } from 'next-intl/server'

import { redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { ADMIN_ROUTES } from '@/shared/constants'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/**
 * Trang Tổng quan đã ẩn khỏi menu, nên `/admin` chuyển thẳng sang mục ĐẦU TIÊN
 * còn trong sidebar (Đơn hàng). Đặt ở đây để mọi lối vào đều đúng — logo khu
 * quản trị, mục "Khu quản trị" ở menu tài khoản, link cũ và bookmark.
 *
 * Bật lại Tổng quan: khôi phục item `overview` trong `admin-nav.config.ts` rồi
 * trả `<AdminInbox />` ở đây như trước.
 */
export default async function AdminHomePage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  redirect({ href: ADMIN_ROUTES.ORDERS, locale })
}
