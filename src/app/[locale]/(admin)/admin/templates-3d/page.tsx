import { redirect } from 'next/navigation'

import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Đã gộp Mẫu 2D + 3D vào "Thư viện mẫu" — chuyển hướng để giữ link cũ. */
export default async function AdminTemplates3dPage({ params }: PageProps) {
  const { locale } = await params
  redirect(`/${locale}/admin/templates`)
}
