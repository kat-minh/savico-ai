'use client'

import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useDesignStore } from '@/features/design'

/**
 * Mục "Tạo dự án mới" trong cột Liên kết nhanh của footer (mục II.2).
 *
 * Nằm ở `app/` vì chỉ layer này được phép chạm vào `features/design`; footer
 * trong `shared/` nhận nó qua slot `createProjectAction` và vẫn là server
 * component.
 */
export function FooterCreateProjectLink() {
  const t = useTranslations('footer')
  const openCreateDialog = useDesignStore((s) => s.openCreateDialog)

  return (
    <button
      type='button'
      onClick={openCreateDialog}
      className='text-primary hover:text-primary/80 flex items-center gap-1.5 text-sm font-medium transition-colors'
    >
      <Plus className='size-4' />
      {t('links.createProject')}
    </button>
  )
}
