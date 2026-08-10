import { setRequestLocale } from 'next-intl/server'

import { TemplateDetail } from '@/features/handbook'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: Locale; id: string }>
}

/** Trang chi tiết mẫu bản vẽ 2D / mẫu nội thất 3D (Phần 2.3 và 2.4). */
export default async function HandbookTemplatePage({ params }: PageProps) {
  const { locale, id } = await params
  setRequestLocale(locale)

  return <TemplateDetail templateId={id} />
}
