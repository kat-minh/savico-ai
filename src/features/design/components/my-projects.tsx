'use client'

import { ArrowRight, Check, House, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { EmptyState, Photo } from '@/shared/components/common'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/shared/components/ui/dropdown-menu'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { designDossierRoute, designEstimateRoute, designInputRoute } from '@/shared/constants/routes'
import { formatDate } from '@/shared/utils'
import { DESIGN_STEPS } from '../constants/design.constants'
import { useProjects } from '../hooks/use-projects'
import type { DesignStep, Project } from '../types/design.types'
import { DeleteProjectDialog, RenameProjectDialog } from './project-menu-dialogs'

const STEP_ROUTE: Record<DesignStep, (projectId: string) => string> = {
  1: designInputRoute,
  2: designEstimateRoute,
  3: designDossierRoute
}

/**
 * "Dự án của tôi" ở trang Tài khoản (mục IX, Hình 17).
 *
 * Lưới 2 cột, mỗi thẻ nằm NGANG: ảnh trái, bên phải là tên dự án, mã, ngày tạo,
 * thanh tiến độ 3 đoạn, badge bước và liên kết "Mở tiếp →"; menu ⋮ ở góc phải.
 * Khác với lưới ở trang Thiết kế & Dự toán (mục IV.1) — chỗ đó là thẻ dọc kèm
 * bộ lọc và phân trang.
 */
export function MyProjects() {
  const t = useTranslations('account.projects')
  const locale = useLocale() as Locale
  const { data: projects, isPending } = useProjects()

  const [renaming, setRenaming] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)

  if (isPending) {
    return (
      <div className='grid gap-4 sm:grid-cols-2'>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className='h-36 w-full rounded-xl' />
        ))}
      </div>
    )
  }

  if (!projects?.length) {
    return <EmptyState title={t('empty.title')} description={t('empty.description')} />
  }

  return (
    <>
      <ul className='grid gap-4 sm:grid-cols-2'>
        {projects.map((project) => {
          const done = project.status === 'completed'
          return (
            <li key={project.id}>
              <article className='bg-card hover:border-primary/50 group relative flex h-full gap-3 rounded-xl border p-3 transition-colors'>
                {/* Ảnh bìa là ảnh lô đất của Bước 1; chưa có thì để khung rỗng. */}
                {project.coverUrl ? (
                  <Photo
                    className='size-28 shrink-0 rounded-lg'
                    src={project.coverUrl}
                    alt={project.name}
                    sizes='112px'
                  />
                ) : (
                  <span className='bg-muted text-muted-foreground/40 flex size-28 shrink-0 items-center justify-center rounded-lg'>
                    <House className='size-8' strokeWidth={1.25} />
                  </span>
                )}

                <div className='flex min-w-0 flex-1 flex-col gap-1'>
                  <div className='flex items-start justify-between gap-2'>
                    <h3 className='min-w-0 truncate text-sm font-semibold'>{project.name}</h3>

                    {/* z-10 để nổi trên lớp phủ của liên kết "Mở tiếp". */}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={t('menu.label')}
                        className='text-muted-foreground hover:text-foreground z-10 -mt-1 -mr-1 shrink-0 rounded p-1 transition-colors'
                      >
                        <MoreHorizontal className='size-4' />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem onSelect={() => setRenaming(project)}>
                          <Pencil className='size-4' />
                          {t('menu.rename')}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant='destructive' onSelect={() => setDeleting(project)}>
                          <Trash2 className='size-4' />
                          {t('menu.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className='text-muted-foreground text-xs'>{project.id}</p>
                  <p className='text-muted-foreground text-xs'>
                    {t('createdAt', { date: formatDate(project.createdAt, locale) })}
                  </p>

                  {/* Ba đoạn RỜI nhau như Hình 17, không phải một thanh liền. */}
                  <span className='mt-1.5 flex gap-1' aria-hidden>
                    {DESIGN_STEPS.map((step) => (
                      <span
                        key={step}
                        className={cn(
                          'h-1.5 flex-1 rounded-full',
                          done || step <= project.currentStep ? 'bg-primary' : 'bg-muted'
                        )}
                      />
                    ))}
                  </span>

                  <div className='mt-auto flex items-center justify-between gap-2 pt-2'>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium',
                        done ? 'bg-accent text-primary-strong' : 'border-primary/40 text-primary-strong border'
                      )}
                    >
                      {done ? t('completed') : t('step', { step: project.currentStep })}
                      {done ? <Check className='size-3' strokeWidth={3} /> : null}
                    </span>

                    {/* `after:absolute after:inset-0` biến cả thẻ thành vùng bấm. */}
                    <Link
                      href={STEP_ROUTE[project.currentStep](project.id)}
                      className='text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-medium transition-colors after:absolute after:inset-0 after:content-[""]'
                    >
                      {t('open')}
                      <ArrowRight className='size-3' />
                    </Link>
                  </div>
                </div>
              </article>
            </li>
          )
        })}
      </ul>

      <RenameProjectDialog project={renaming} onClose={() => setRenaming(null)} />
      <DeleteProjectDialog project={deleting} onClose={() => setDeleting(null)} />
    </>
  )
}
