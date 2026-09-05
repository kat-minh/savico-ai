'use client'

import { ArrowRight, Check, House, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Fragment } from 'react'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { Photo } from '@/shared/components/common'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/shared/components/ui/dropdown-menu'
import { designDossierRoute, designEstimateRoute, designInputRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { formatDate } from '@/shared/utils'
import { DESIGN_STEPS } from '../constants/design.constants'
import { miniStepState } from '../services/project-list.service'
import type { Project, ProjectStatus } from '../types/design.types'

interface ProjectCardProps {
  project: Project
  onRename: (project: Project) => void
  onDelete: (project: Project) => void
}

/**
 * Liên kết hành động đổi theo trạng thái (mục IV.1, Hình 02): đang nhập liệu →
 * "Tiếp tục nhập", đang thiết kế → "Mở tiếp", chờ duyệt → "Xem dự toán",
 * hoàn tất → "Xem hồ sơ".
 */
const ACTION_BY_STATUS: Record<
  ProjectStatus,
  { route: (projectId: string) => string; labelKey: 'continueInput' | 'open' | 'viewEstimate' | 'viewDossier' }
> = {
  input: { route: designInputRoute, labelKey: 'continueInput' },
  designing: { route: designEstimateRoute, labelKey: 'open' },
  review: { route: designEstimateRoute, labelKey: 'viewEstimate' },
  completed: { route: designDossierRoute, labelKey: 'viewDossier' }
}

/**
 * Badge trạng thái nằm bên phải tên dự án (không đè lên ảnh). Ba mức nền theo
 * Hình 02: xám nhạt → xanh nhạt → vàng nhạt → xanh đặc khi hoàn tất.
 */
const BADGE_CLASS: Record<ProjectStatus, string> = {
  input: 'bg-muted text-muted-foreground',
  designing: 'bg-accent text-primary-strong',
  review: 'bg-warning/15 text-warning-strong',
  completed: 'bg-primary text-primary-foreground'
}

/** Chấm "đang làm": chờ duyệt là mốc chờ người khác nên tô vàng, còn lại xanh. */
function currentDotClass(status: ProjectStatus): string {
  return status === 'review' ? 'bg-warning text-warning-foreground' : 'bg-primary text-primary-foreground'
}

/**
 * Mini-stepper 3 nấc nằm ngang, các chấm nối bằng đường kẻ (Hình 02):
 * Nhập liệu — Dự toán — Hồ sơ.
 */
function MiniStepper({ project }: { project: Project }) {
  const t = useTranslations('design.projects')

  return (
    <ol className='flex min-w-0 flex-1 items-start'>
      {DESIGN_STEPS.map((step, index) => {
        const state = miniStepState(step, project)
        const next = DESIGN_STEPS[index + 1]
        // Đoạn nối sáng lên khi nấc kế tiếp đã bắt đầu — đọc được tiến độ mà
        // không cần nhìn từng chấm.
        const linkReached = next ? miniStepState(next, project) !== 'pending' : false

        return (
          <Fragment key={step}>
            <li className='flex shrink-0 flex-col items-center gap-1'>
              <span
                className={cn(
                  'flex size-[18px] items-center justify-center rounded-full text-[10px] leading-none font-semibold',
                  state === 'done' && 'bg-primary text-primary-foreground',
                  state === 'current' && currentDotClass(project.status),
                  state === 'pending' && 'border-border text-muted-foreground border bg-transparent'
                )}
              >
                {state === 'done' ? <Check className='size-3' strokeWidth={3.5} /> : step}
              </span>
              <span
                className={cn(
                  'text-[10px] leading-none whitespace-nowrap',
                  state === 'pending' ? 'text-muted-foreground' : 'text-foreground'
                )}
              >
                {t(`steps.${step}`)}
              </span>
            </li>

            {next ? (
              <span
                aria-hidden
                className={cn('mt-2 h-0.5 min-w-3 flex-1 rounded-full', linkReached ? 'bg-primary' : 'bg-border')}
              />
            ) : null}
          </Fragment>
        )
      })}
    </ol>
  )
}

/**
 * Một thẻ trong lưới "DỰ ÁN CỦA TÔI" (mục IV.1, Hình 02): ảnh thu nhỏ với nút ⋮
 * góc phải, tên dự án kèm badge trạng thái, mã dự án, ngày cập nhật, rồi hàng
 * cuối gồm mini-stepper 3 nấc bên trái và liên kết hành động bên phải.
 */
export function ProjectCard({ project, onRename, onDelete }: ProjectCardProps) {
  const t = useTranslations('design.projects')
  const locale = useLocale() as Locale
  const action = ACTION_BY_STATUS[project.status]

  return (
    <article className='bg-card hover:border-primary/50 group relative flex h-full flex-col overflow-hidden rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md'>
      <div className='relative'>
        {/* Ảnh bìa là ảnh lô đất của Bước 1; chưa có thì để khung rỗng có biểu
            tượng thay vì bỏ trống. */}
        {project.coverUrl ? (
          <Photo className='aspect-[16/9] w-full' src={project.coverUrl} alt={project.name} sizes='420px' />
        ) : (
          // Khung rỗng tô nhạt màu thương hiệu thay vì ô xám trơn: ô xám với
          // biểu tượng mờ trông như ảnh vỡ chứ không như "chưa có ảnh".
          <div className='from-accent to-accent/40 text-primary/40 flex aspect-[16/9] w-full items-center justify-center bg-linear-to-br'>
            <House className='size-10' strokeWidth={1.25} />
          </div>
        )}

        {/* z-10 để nổi trên lớp phủ của liên kết hành động bên dưới — nếu không
            bấm vào ⋮ sẽ mở dự án thay vì mở menu. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t('menu.label')}
            className='bg-background/90 text-muted-foreground hover:text-foreground absolute top-2.5 right-2.5 z-10 flex size-7 items-center justify-center rounded-full shadow-sm backdrop-blur transition-colors'
          >
            <MoreHorizontal className='size-4' />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onSelect={() => onRename(project)}>
              <Pencil className='size-4' />
              {t('menu.rename')}
            </DropdownMenuItem>
            <DropdownMenuItem variant='destructive' onSelect={() => onDelete(project)}>
              <Trash2 className='size-4' />
              {t('menu.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className='flex flex-1 flex-col p-3.5'>
        <div className='flex items-start justify-between gap-2'>
          <h3 className='min-w-0 truncate text-[15px] font-semibold'>{project.name}</h3>
          <span
            className={cn(
              'flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium',
              BADGE_CLASS[project.status]
            )}
          >
            {t(`status.${project.status}`)}
            {project.status === 'completed' ? <Check className='size-3' strokeWidth={3} /> : null}
          </span>
        </div>

        <p className='text-muted-foreground mt-1 text-xs'>{project.id}</p>
        <p className='text-muted-foreground text-xs'>
          {t('updatedAt', { date: formatDate(project.updatedAt, locale) })}
        </p>

        <div className='mt-3 flex items-start justify-between gap-3'>
          <MiniStepper project={project} />

          {/* `after:absolute after:inset-0` biến cả thẻ thành vùng bấm mà không
              phải lồng nút ⋮ vào trong thẻ <a>. */}
          <Link
            href={action.route(project.id)}
            className='text-primary hover:text-primary/80 mt-0.5 inline-flex shrink-0 items-center gap-1 text-[13px] font-medium transition-colors after:absolute after:inset-0 after:content-[""]'
          >
            {t(`action.${action.labelKey}`)}
            <ArrowRight className='size-3.5' />
          </Link>
        </div>
      </div>
    </article>
  )
}
