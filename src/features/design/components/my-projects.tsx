'use client'

import { ChevronRight, House } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { EmptyState, Photo } from '@/shared/components/common'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { designDossierRoute, designEstimateRoute, designInputRoute } from '@/shared/constants/routes'
import type { Locale } from '@/i18n/routing'
import { formatDate } from '@/shared/utils'
import { DESIGN_STEPS } from '../constants/design.constants'
import { useProjects } from '../hooks/use-projects'
import type { DesignStep } from '../types/design.types'

const STEP_ROUTE: Record<DesignStep, (projectId: string) => string> = {
  1: designInputRoute,
  2: designEstimateRoute,
  3: designDossierRoute
}

/**
 * "Dự án của tôi" trong Cửa sổ cá nhân (mục IV, khu vực 2).
 * Tên dự án, Project ID, ngày tạo, trạng thái đang ở bước nào — bấm vào mở tiếp.
 */
export function MyProjects() {
  const t = useTranslations('account.projects')
  const locale = useLocale() as Locale
  const { data: projects, isPending } = useProjects()

  if (isPending) {
    return (
      <div className='space-y-3'>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className='h-20 w-full rounded-xl' />
        ))}
      </div>
    )
  }

  if (!projects?.length) {
    return <EmptyState title={t('empty.title')} description={t('empty.description')} />
  }

  return (
    <ul className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
      {projects.map((project) => (
        <li key={project.id}>
          <Link
            href={STEP_ROUTE[project.currentStep](project.id)}
            className='bg-card hover:border-primary/50 group flex h-full flex-col overflow-hidden rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-md'
          >
            {/* Ảnh bìa là ảnh lô đất của Bước 1; chưa có thì để khung rỗng có
                biểu tượng thay vì bỏ trống. */}
            {project.coverUrl ? (
              <Photo className='aspect-video w-full' src={project.coverUrl} alt={project.name} sizes='360px' />
            ) : (
              <div className='bg-muted text-muted-foreground/40 flex aspect-video w-full items-center justify-center'>
                <House className='size-10' strokeWidth={1.25} />
              </div>
            )}

            <div className='flex flex-1 flex-col gap-3 p-4'>
              <div className='min-w-0'>
                <p className='truncate font-semibold'>{project.name}</p>
                <p className='text-muted-foreground text-xs'>
                  {project.id} · {formatDate(project.createdAt, locale)}
                </p>
              </div>

              {/* Ba vạch tiến trình đọc nhanh hơn một dòng chữ "Bước 2/3". */}
              <div className='mt-auto space-y-2'>
                <span className='flex gap-1' aria-hidden>
                  {DESIGN_STEPS.map((step) => (
                    <span
                      key={step}
                      className={cn('h-1 flex-1 rounded-full', step <= project.currentStep ? 'bg-primary' : 'bg-muted')}
                    />
                  ))}
                </span>
                <div className='flex items-center justify-between gap-2'>
                  <span className='bg-accent text-primary-strong rounded-full px-2.5 py-1 text-xs font-medium'>
                    {t('step', { step: project.currentStep })}
                  </span>
                  <span className='text-muted-foreground group-hover:text-primary inline-flex items-center gap-1 text-xs font-medium transition-colors'>
                    {t('open')}
                    <ChevronRight className='size-3.5' />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
