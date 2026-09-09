'use client'

import { HomeCta } from '@/features/landing'
import { useDesignStore } from '@/features/design'

/** App-layer glue: nút của dải CTA cuối trang mở modal Tạo dự án. */
export function HomeCtaSection() {
  const openCreateDialog = useDesignStore((s) => s.openCreateDialog)
  return <HomeCta onCreateProject={openCreateDialog} />
}
