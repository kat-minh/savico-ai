import { redirect } from 'next/navigation'

import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Đã gộp phong cách KT + NT vào "Phong cách" — chuyển hướng để giữ link cũ. */
export default async function AdminInteriorStylesPage({ params }: PageProps) {
  const { locale } = await params
  redirect(`/${locale}/admin/styles`)
}
