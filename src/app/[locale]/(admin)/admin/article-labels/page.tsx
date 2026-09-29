import { redirect } from 'next/navigation'

import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

/** Danh mục tin tức giờ sửa bằng nút "Quản lý danh mục" trên màn Bài viết. */
export default async function AdminArticleLabelsPage({ params }: PageProps) {
  const { locale } = await params
  redirect(`/${locale}/admin/articles`)
}
