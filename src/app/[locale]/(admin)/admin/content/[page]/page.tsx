import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'

import { ADMIN_CONTENT_PAGES, ContentWorkspace, adminContentPageOf } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale; page: string }>
}

/**
 * Một route động cho MỌI màn nội dung — trang chủ, Cẩm nang, Hướng dẫn, Gói
 * đăng ký, Tư vấn, Thiết kế, Tài khoản, trang tĩnh, menu & chân trang, chuỗi
 * giao diện.
 *
 * Mười màn đó cùng một hình dạng (đầu trang + các tab), chỉ khác phần khai báo
 * trong `admin-pages.config`, nên mười file route giống hệt nhau là thừa: thêm
 * trang mới chỉ cần thêm một mục vào bảng khai báo.
 */
export function generateStaticParams() {
  return ADMIN_CONTENT_PAGES.map((page) => ({ page: page.key }))
}

export default async function AdminContentPage({ params }: PageProps) {
  const { locale, page } = await params
  setRequestLocale(locale)

  const config = adminContentPageOf(page)
  if (!config) notFound()

  return <ContentWorkspace page={config} />
}
