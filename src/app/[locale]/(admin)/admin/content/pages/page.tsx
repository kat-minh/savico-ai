import { setRequestLocale } from 'next-intl/server'

import { StaticPagesEditor } from '@/features/admin'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Sửa trang Điều khoản sử dụng và Chính sách bảo mật (mục II.2). */
export default async function AdminStaticPagesPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <StaticPagesEditor />
}
