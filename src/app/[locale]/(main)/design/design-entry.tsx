'use client'

import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ProjectBoard, useDesignStore } from '@/features/design'
import { Button } from '@/shared/components/ui/button'

/**
 * Trang "Thiết kế & Dự toán — Dự án của tôi" (mục IV.1).
 *
 * Tiêu đề + dòng phụ + nút "Tạo dự án mới" ở đầu trang, phần còn lại do
 * `ProjectBoard` dựng (4 thẻ đếm, bộ lọc, lưới dự án, phân trang).
 */
export function DesignEntry() {
  const t = useTranslations('design.entry')
  const openCreateDialog = useDesignStore((s) => s.openCreateDialog)

  return (
    <div className='mx-auto w-full max-w-[90rem] space-y-8 px-4 py-10 lg:px-8'>
      <header className='flex flex-wrap items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-semibold tracking-tight'>{t('title')}</h1>
          <p className='text-muted-foreground text-pretty'>{t('subtitle')}</p>
        </div>
        <Button className='rounded-xl' onClick={openCreateDialog}>
          <Plus className='size-4' />
          {t('create')}
        </Button>
      </header>

      <ProjectBoard />
    </div>
  )
}
