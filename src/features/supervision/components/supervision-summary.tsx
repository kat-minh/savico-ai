'use client'

import { ArrowRight, Check, ShieldCheck } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ROUTES, supervisionRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { formatDate } from '@/shared/utils'
import { useSupervisionProject } from '../hooks/use-supervision'
import { currentStage, daysUntil, progressPercent } from '../services/supervision.service'

interface SupervisionSummaryProps {
  projectId: string
}

/**
 * Khối "GIÁM SÁT CỦA TÔI" trên trang Tài khoản (S24).
 *
 * Bản mô tả đặt khối này ở HAI chỗ trên cùng một màn: cột trái và bên trong thẻ
 * dự án, với gần như cùng một bộ số (tiến độ %, giai đoạn hiện tại, còn X ngày,
 * nút Bảng điều khiển). Ở đây chỉ dựng MỘT khối, đặt ngay trên lưới dự án — đọc
 * hai lần cùng một thứ không làm nó rõ hơn.
 *
 * Mọi con số lấy từ `services/supervision.service`, đúng nguồn với bảng điều
 * khiển, nên hai màn không thể nói hai con số khác nhau.
 */
export function SupervisionSummary({ projectId }: SupervisionSummaryProps) {
  const t = useTranslations('supervision.account')
  const tStages = useTranslations('supervision.stages')
  const tTiers = useTranslations('supervision.tiers')
  const tAlias = useTranslations('supervision.tierAlias')
  const locale = useLocale() as Locale

  const { data: project, isPending } = useSupervisionProject(projectId)

  if (isPending) return <Skeleton className='h-40 rounded-2xl' />

  // Dự án chưa mua gói: R8 — chỗ này là nút "Chọn cách quản lý thi công", link
  // thẳng tới tab Gói giám sát chứ không mở popup.
  if (!project) {
    return (
      <section className='bg-card flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed p-5'>
        <p className='text-muted-foreground text-sm text-pretty'>{t('selfManaged')}</p>
        <Button asChild variant='outline'>
          <Link href={ROUTES.PLANS_SUPERVISION}>{t('chooseManagement')}</Link>
        </Button>
      </section>
    )
  }

  const stage = currentStage(project)
  const percent = progressPercent(project)
  const remaining = daysUntil(stage.plannedEnd)

  return (
    <section className='bg-card rounded-2xl border p-5'>
      <div className='flex flex-wrap items-center gap-3'>
        <span className='bg-accent text-primary flex size-10 shrink-0 items-center justify-center rounded-xl'>
          <ShieldCheck className='size-5' />
        </span>
        <div className='min-w-0 flex-1'>
          <h2 className='text-muted-foreground text-[11px] font-semibold tracking-wide uppercase'>{t('title')}</h2>
          <p className='font-semibold'>
            {project.projectName}
            <span className='text-warning-strong ml-2 text-xs font-medium'>
              {tTiers(project.packageTier)} — {tAlias(project.packageTier)}
            </span>
          </p>
          <p className='text-muted-foreground font-mono text-xs'>{project.packageCode}</p>
        </div>

        <Button asChild>
          <Link href={supervisionRoute(project.id)}>
            {t('open')}
            <ArrowRight className='size-4' />
          </Link>
        </Button>
      </div>

      {/* Sợi chỉ 6 nút — bản rút gọn của sợi chỉ trong bảng điều khiển. */}
      <ol className='mt-4 flex items-center gap-1.5'>
        {project.stages.map((item) => (
          <li key={item.key} className='flex flex-1 items-center gap-1.5'>
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                item.status === 'confirmed' && 'bg-primary text-primary-foreground',
                item.status === 'inProgress' && 'bg-warning text-warning-foreground',
                item.status === 'upcoming' && 'bg-muted text-muted-foreground'
              )}
              title={tStages(item.key)}
            >
              {item.status === 'confirmed' ? <Check className='size-3' strokeWidth={3} /> : item.index}
            </span>
            {item.index < project.stages.length ? (
              <span
                aria-hidden
                className={cn('h-0.5 flex-1 rounded-full', item.status === 'confirmed' ? 'bg-primary' : 'bg-border')}
              />
            ) : null}
          </li>
        ))}
      </ol>

      <dl className='text-muted-foreground mt-4 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2 lg:grid-cols-4'>
        <div>
          <dt>{t('stage', { current: stage.index })}</dt>
          <dd className='text-foreground font-medium'>{tStages(stage.key)}</dd>
        </div>
        <div>
          <dt>{t('progress', { percent })}</dt>
          <dd className={cn('font-medium', remaining < 0 ? 'text-destructive' : 'text-primary')}>
            {t('daysLeft', { days: remaining })}
          </dd>
        </div>
        <div>
          <dt>{t('inspections', { used: project.inspectionsUsed, total: project.inspectionsTotal })}</dt>
          <dd className='text-foreground font-medium'>
            {t('packageUntil', { date: formatDate(project.expiresAt, locale) })}
          </dd>
        </div>
        <div>
          <dt>{t('handover', { date: formatDate(project.handoverDate, locale) })}</dt>
        </div>
      </dl>
    </section>
  )
}
