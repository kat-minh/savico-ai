'use client'

import { Plus } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { MyProjects, useDesignStore, useProjects } from '@/features/design'
import { Button } from '@/shared/components/ui/button'

/**
 * Mở mục Thiết kế & Dự toán khi chưa có dự án nào đang mở → tự mở modal Tạo dự
 * án (mục III.1). Nếu tài khoản đã có dự án, hiện danh sách để mở tiếp.
 */
export function DesignEntry() {
  const t = useTranslations('design.entry')
  const openCreateDialog = useDesignStore((s) => s.openCreateDialog)
  const { data: projects, isPending } = useProjects()

  const isEmpty = !isPending && projects?.length === 0

  useEffect(() => {
    if (isEmpty) openCreateDialog()
  }, [isEmpty, openCreateDialog])

  return (
    <div className='mx-auto w-full max-w-3xl space-y-6 px-4 py-10 lg:px-8'>
      <header className='flex flex-wrap items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-semibold tracking-tight'>{t('title')}</h1>
          <p className='text-muted-foreground'>{t('subtitle')}</p>
        </div>
        <Button className='rounded-full' onClick={openCreateDialog}>
          <Plus className='size-4' />
          {t('create')}
        </Button>
      </header>

      <MyProjects />
    </div>
  )
}
