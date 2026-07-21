'use client'

import { HomeHero } from '@/features/landing'
import { useDesignStore } from '@/features/design'

/**
 * App-layer glue: nút "Tạo dự án mới" ở hero mở modal Tạo dự án của
 * `features/design`. `features/landing` không được import `features/design`,
 * nên lớp app nối hai bên với nhau.
 */
export function HomeHeroSection() {
  const openCreateDialog = useDesignStore((s) => s.openCreateDialog)
  return <HomeHero onCreateProject={openCreateDialog} />
}
