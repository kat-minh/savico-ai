'use client'

import { HomeJourney } from '@/features/landing'
import { useDesignStore } from '@/features/design'

/**
 * App-layer glue giống `home-hero-section`: nút "Tạo dự án mới" cuối dải 5 bước
 * mở modal Tạo dự án của `features/design`, mà `features/landing` thì không được
 * import feature kia.
 */
export function HomeJourneySection() {
  const openCreateDialog = useDesignStore((s) => s.openCreateDialog)
  return <HomeJourney onCreateProject={openCreateDialog} />
}
