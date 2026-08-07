'use client'

import { CheckCircle2, Clock, FolderClosed, SquarePen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/shared/lib/utils'
import { PROJECT_STAT_CARDS, type ProjectStatCard } from '../constants/design.constants'
import type { ProjectCounts } from '../services/project-list.service'
import type { ProjectStatus } from '../types/design.types'

interface ProjectStatCardsProps {
  counts: ProjectCounts
  /** Chip lọc đang áp dụng — `null` là "Tất cả". */
  activeStatus: ProjectStatus | null
  onSelect: (status: ProjectStatus | null) => void
}

/** Thẻ "Tổng dự án" không lọc gì, ba thẻ còn lại lọc theo trạng thái tương ứng. */
const CARD_META: Record<ProjectStatCard, { status: ProjectStatus | null; icon: LucideIcon; tone: string }> = {
  total: { status: null, icon: FolderClosed, tone: 'bg-muted text-muted-foreground' },
  designing: { status: 'designing', icon: SquarePen, tone: 'bg-accent text-primary-strong' },
  review: { status: 'review', icon: Clock, tone: 'bg-warning/15 text-warning-strong' },
  completed: { status: 'completed', icon: CheckCircle2, tone: 'bg-accent text-primary-strong' }
}

/** Số một chữ số hiển thị dạng "06" như Hình 02. */
const pad = (value: number) => String(value).padStart(2, '0')

/**
 * 4 thẻ đếm nhanh phía trên khối danh sách (mục IV.1, Hình 02). Bấm một thẻ là
 * lọc lưới theo trạng thái đó; thẻ đang lọc tô nền xanh nhạt.
 */
export function ProjectStatCards({ counts, activeStatus, onSelect }: ProjectStatCardsProps) {
  const t = useTranslations('design.projects.stats')

  return (
    <ul className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
      {PROJECT_STAT_CARDS.map((key) => {
        const { status, icon: Icon, tone } = CARD_META[key]
        const active = activeStatus === status
        return (
          <li key={key}>
            <button
              type='button'
              onClick={() => onSelect(status)}
              aria-pressed={active}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors',
                active ? 'border-primary/40 bg-accent/60' : 'bg-card hover:bg-accent/30'
              )}
            >
              <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', tone)}>
                <Icon className='size-[18px]' />
              </span>
              <span className='min-w-0'>
                <span className='block text-xl leading-none font-bold'>{pad(counts[key])}</span>
                <span className='text-muted-foreground mt-1.5 block truncate text-xs'>{t(key)}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
