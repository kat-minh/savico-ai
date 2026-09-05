'use client'

import { AlertTriangle, ArrowRight, CalendarClock, ChevronDown, Clock, Upload } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { EmptyState } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ROUTES, supervisionRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { formatDate } from '@/shared/utils'
import { STAGE_COUNT, STANDARD_SCHEDULE_DAYS } from '../constants/supervision.constants'
import { useSupervisionProject } from '../hooks/use-supervision'
import {
  confirmedCount,
  currentStage,
  daysUntil,
  elapsedPercent,
  handoverDrift,
  needsCustomerApproval,
  progressPercent
} from '../services/supervision.service'
import type { SupervisionProject, SupervisionStage } from '../types/supervision.types'
import { StageDetail } from './stage-detail'
import { StageUploadDialog } from './stage-upload-dialog'

interface SupervisionDashboardProps {
  projectId: string
  /** Giai đoạn đang mở, lấy từ `?stage=` để chia sẻ được đường dẫn tới đúng giai đoạn. */
  stageIndex?: number
}

/**
 * Bảng điều khiển giám sát — MỘT trang với bốn trạng thái giai đoạn (S20, S21,
 * S22, S23), không phải bốn trang.
 *
 * Thứ tự khối theo bản mô tả: banner nhắc hạn → thẻ dự án + 5 ô số → sợi chỉ 6
 * giai đoạn → bảng lịch trình → hai cột (danh sách giai đoạn | chi tiết).
 *
 * Bảng lịch trình GẤP LẠI được và mặc định đóng. R9 yêu cầu nó nằm trên danh
 * sách giai đoạn, nhưng để mở sẵn thì banner + thẻ 5 ô + sợi chỉ + bảng 6 dòng
 * đẩy phần chi tiết — chỗ khách thực sự làm việc — xuống dưới màn hình đầu. Sợi
 * chỉ ngay trên đó đã nói đủ về lịch; ai cần con số thì mở bảng ra.
 */
export function SupervisionDashboard({ projectId, stageIndex }: SupervisionDashboardProps) {
  const t = useTranslations('supervision.dashboard')
  const tStages = useTranslations('supervision.stages')
  const locale = useLocale() as Locale
  const { data: project, isPending } = useSupervisionProject(projectId)

  const [uploadStage, setUploadStage] = useState<SupervisionStage | null>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  const selected =
    project?.stages.find((stage) => stage.index === stageIndex) ?? (project ? currentStage(project) : undefined)

  // Chọn giai đoạn ở cột trái thì cuộn phần chi tiết vào tầm nhìn: trên màn hình
  // hẹp, chi tiết nằm dưới cả danh sách nên bấm xong sẽ tưởng không có gì xảy ra.
  const selectedIndex = selected?.index
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedIndex])

  if (isPending) {
    return (
      <div className='mx-auto w-full max-w-6xl space-y-5 px-4 py-8 lg:px-8'>
        <Skeleton className='h-24 rounded-2xl' />
        <Skeleton className='h-40 rounded-2xl' />
        <Skeleton className='h-96 rounded-2xl' />
      </div>
    )
  }

  if (!project) {
    return (
      <div className='mx-auto w-full max-w-3xl px-4 py-16 lg:px-8'>
        <EmptyState
          title={t('empty.title')}
          description={t('empty.body')}
          action={
            <Button asChild>
              <Link href={ROUTES.PLANS_SUPERVISION}>{t('empty.action')}</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className='mx-auto w-full max-w-6xl space-y-5 px-4 py-8 lg:px-8'>
      <nav className='text-muted-foreground flex flex-wrap items-center gap-2 text-sm'>
        <Link href={ROUTES.ACCOUNT} className='hover:text-foreground'>
          {t('breadcrumbProjects')}
        </Link>
        <span aria-hidden>›</span>
        <span>{project.projectName}</span>
        <span aria-hidden>›</span>
        <span className='text-foreground'>{t('title')}</span>
      </nav>

      <header className='flex flex-wrap items-start justify-between gap-4'>
        <div className='min-w-0 max-w-3xl'>
          <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>{t('title')}</h1>
          <p className='text-muted-foreground mt-1.5 text-sm text-pretty'>{t('lead')}</p>
        </div>
        <Button asChild variant='outline'>
          <Link href={ROUTES.ACCOUNT}>{t('backToProject')}</Link>
        </Button>
      </header>

      <DashboardBanner project={project} onUpload={setUploadStage} />
      <ProjectCard project={project} />
      <StageThread project={project} selectedIndex={selected?.index} />
      <ScheduleTable project={project} />

      <div className='grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]'>
        <section className='bg-card rounded-2xl border p-3'>
          <div className='flex items-center justify-between px-1.5 pb-2'>
            <h2 className='text-muted-foreground text-[11px] font-semibold tracking-wide uppercase'>
              {t('stageList.title')}
            </h2>
            <span className='text-muted-foreground text-[11px]'>
              {t('stageList.doneCount', { count: confirmedCount(project) })}
            </span>
          </div>

          <ul className='space-y-1.5'>
            {project.stages.map((stage) => (
              <li key={stage.key}>
                <Link
                  href={supervisionRoute(projectId, stage.index)}
                  scroll={false}
                  aria-current={stage.index === selected?.index ? 'true' : undefined}
                  className={cn(
                    'block rounded-xl border p-3 transition-colors',
                    stage.index === selected?.index
                      ? 'border-primary bg-accent/40'
                      : 'border-transparent hover:border-primary/30 hover:bg-muted/50'
                  )}
                >
                  <div className='flex items-center gap-2'>
                    <span className='text-muted-foreground font-mono text-[11px]'>GĐ {stage.index}</span>
                    <StageStatusBadge stage={stage} />
                  </div>
                  <p className='mt-1 text-sm font-medium'>{tStages(stage.key)}</p>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    {formatDate(stage.plannedStart, locale, { day: '2-digit', month: '2-digit' })} –{' '}
                    {formatDate(stage.plannedEnd, locale, { day: '2-digit', month: '2-digit' })}
                  </p>
                  {needsCustomerApproval(stage) ? (
                    <span className='bg-warning/20 text-warning-strong mt-1.5 inline-block rounded-md px-2 py-0.5 text-[11px] font-medium'>
                      {t('stageList.needsApproval')}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div ref={detailRef} className='min-w-0 scroll-mt-24'>
          {selected ? (
            <StageDetail
              projectId={projectId}
              project={project}
              stage={selected}
              onUpload={() => setUploadStage(selected)}
            />
          ) : null}
        </div>
      </div>

      <StageUploadDialog projectId={projectId} stage={uploadStage} onClose={() => setUploadStage(null)} />
    </div>
  )
}

/**
 * Banner nhắc hạn của giai đoạn đang chạy — hoặc nhắc duyệt yêu cầu sửa đổi khi
 * có cái đang chờ khách (S22). Bổ sung so với bản mô tả: khi quá hạn thì banner
 * đổi hẳn sang màu cảnh báo và nói "quá hạn X ngày", thay vì đếm ngược âm.
 */
function DashboardBanner({
  project,
  onUpload
}: {
  project: SupervisionProject
  onUpload: (stage: SupervisionStage) => void
}) {
  const t = useTranslations('supervision.dashboard.banner')
  const tStages = useTranslations('supervision.stages')
  const locale = useLocale() as Locale

  const stage = currentStage(project)
  const remaining = daysUntil(stage.plannedEnd)
  const overdue = remaining < 0
  const due = formatDate(stage.plannedEnd, locale, { day: '2-digit', month: '2-digit' })

  return (
    <section
      className={cn(
        'flex flex-wrap items-center gap-4 rounded-2xl border p-4',
        overdue ? 'border-destructive/40 bg-destructive/10' : 'border-warning/40 bg-warning/10'
      )}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl',
          overdue ? 'bg-destructive/15 text-destructive' : 'bg-warning/20 text-warning-strong'
        )}
      >
        {overdue ? <AlertTriangle className='size-5' /> : <Clock className='size-5' />}
      </span>

      <p className='min-w-0 flex-1 text-sm text-pretty'>
        <strong className={overdue ? 'text-destructive' : 'text-warning-strong'}>
          {overdue ? t('overdue', { days: Math.abs(remaining) }) : t('remaining', { days: remaining })}
        </strong>{' '}
        {overdue
          ? t('overdueBody', { index: stage.index, stage: tStages(stage.key), due })
          : t('body', { index: stage.index, stage: tStages(stage.key), due })}
      </p>

      {stage.status === 'inProgress' ? (
        <Button onClick={() => onUpload(stage)}>
          <Upload className='size-4' />
          {t('upload', { index: stage.index })}
        </Button>
      ) : (
        <Button asChild variant='outline'>
          <Link href={supervisionRoute(project.id, stage.index)}>
            {t('goTo', { index: stage.index })}
            <ArrowRight className='size-4' />
          </Link>
        </Button>
      )}
    </section>
  )
}

/** Thẻ dự án + 5 ô số của bản mô tả. */
function ProjectCard({ project }: { project: SupervisionProject }) {
  const t = useTranslations('supervision.dashboard.project')
  const tStages = useTranslations('supervision.stages')
  const tAlias = useTranslations('supervision.tierAlias')
  const tTiers = useTranslations('supervision.tiers')
  const locale = useLocale() as Locale

  const stage = currentStage(project)
  const percent = progressPercent(project)
  const elapsed = elapsedPercent(project)
  const drift = handoverDrift(project)
  const remaining = daysUntil(stage.plannedEnd)

  return (
    <section className='bg-card rounded-2xl border p-5'>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
        <h2 className='text-lg font-semibold'>{project.projectName}</h2>
        {/* Một gói, một tên: bảng giá bán "SVC CHECK" còn bảng điều khiển gọi
            "Gói An Tâm" — hiện cả hai cạnh nhau để khách không tưởng là hai thứ. */}
        <span className='bg-warning/15 text-warning-strong rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase'>
          {t('service')} · {tTiers(project.packageTier)} — {tAlias(project.packageTier)}
        </span>
      </div>

      <p className='text-muted-foreground mt-1 font-mono text-xs'>
        {project.id} · {t('engineer')}: {project.engineer} · {t('packageCode')}: {project.packageCode}
      </p>

      <dl className='mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-5'>
        <div>
          <dt className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>{t('progress')}</dt>
          <dd className='mt-1'>
            <span className='text-2xl font-bold'>{percent}%</span>
            <span className='text-muted-foreground ml-1.5 text-xs'>
              {t('progressDone', { done: confirmedCount(project) })}
            </span>
            {/* Vạch cam = thời gian đã trôi, đặt chồng lên thanh tiến độ công
                việc để so sánh được ngay hai nhịp với nhau. */}
            <span className='bg-muted relative mt-2 block h-2 overflow-hidden rounded-full'>
              <span className='bg-primary absolute inset-y-0 left-0 rounded-full' style={{ width: `${percent}%` }} />
              <span className='bg-warning absolute inset-y-0 w-0.5' style={{ left: `${elapsed}%` }} />
            </span>
            <span className='text-muted-foreground mt-1 block text-[11px]'>{t('elapsed', { percent: elapsed })}</span>
          </dd>
        </div>

        <div>
          <dt className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>{t('currentStage')}</dt>
          <dd className='mt-1 text-sm font-semibold'>
            {stage.index}/{STAGE_COUNT} · {tStages(stage.key)}
          </dd>
        </div>

        <div>
          <dt className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>{t('due')}</dt>
          <dd className='mt-1 text-sm font-semibold'>{formatDate(stage.plannedEnd, locale)}</dd>
          <dd className={cn('text-xs', remaining < 0 ? 'text-destructive' : 'text-primary')}>
            {t('daysLeft', { days: remaining })}
          </dd>
        </div>

        <div>
          <dt className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>{t('handover')}</dt>
          <dd className='mt-1 text-sm font-semibold'>{formatDate(project.handoverDate, locale)}</dd>
          <dd className='text-muted-foreground text-xs'>{drift.early ? t('handoverEarly') : t('handoverLate')}</dd>
        </div>

        <div>
          <dt className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>{t('inspections')}</dt>
          <dd className='mt-1'>
            <span className='text-2xl font-bold'>{project.inspectionsUsed}</span>
            <span className='text-muted-foreground text-sm'>/{project.inspectionsTotal}</span>
            <span className='bg-muted mt-2 block h-2 overflow-hidden rounded-full'>
              <span
                className='bg-primary block h-full rounded-full'
                style={{ width: `${Math.min(100, (project.inspectionsUsed / project.inspectionsTotal) * 100)}%` }}
              />
            </span>
          </dd>
        </div>
      </dl>
    </section>
  )
}

/** Sợi chỉ 6 giai đoạn có mốc HÔM NAY. */
function StageThread({ project, selectedIndex }: { project: SupervisionProject; selectedIndex?: number }) {
  const t = useTranslations('supervision.dashboard.thread')
  const tStages = useTranslations('supervision.stages')
  const locale = useLocale() as Locale
  const elapsed = elapsedPercent(project)

  return (
    <section className='bg-card relative rounded-2xl border px-5 pt-8 pb-5'>
      <span
        className='text-warning-strong absolute top-2 -translate-x-1/2 text-[10px] font-semibold tracking-wide uppercase'
        style={{ left: `${Math.min(94, Math.max(6, elapsed))}%` }}
      >
        {t('today')}
      </span>

      <ol className='flex items-start'>
        {project.stages.map((stage, index) => {
          const done = stage.status === 'confirmed'
          const running = stage.status === 'inProgress'
          return (
            <li key={stage.key} className='flex min-w-0 flex-1 items-start'>
              <div className='flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center'>
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full border-2 text-[11px] font-semibold',
                    done && 'border-primary bg-primary text-primary-foreground',
                    running && 'border-warning text-warning-strong bg-card',
                    !done && !running && 'border-border text-muted-foreground bg-card',
                    stage.index === selectedIndex && 'ring-primary/40 ring-2 ring-offset-1'
                  )}
                >
                  {stage.index}
                </span>
                <span
                  className={cn('text-[11px] leading-tight', done || running ? 'font-medium' : 'text-muted-foreground')}
                >
                  {tStages(stage.key)}
                </span>
                <span className='text-muted-foreground text-[10px]'>
                  {formatDate(stage.plannedStart, locale, { day: '2-digit', month: '2-digit' })} –{' '}
                  {formatDate(stage.plannedEnd, locale, { day: '2-digit', month: '2-digit' })}
                </span>
              </div>

              {index < project.stages.length - 1 ? (
                <span
                  aria-hidden
                  className={cn('mt-3.5 h-0.5 flex-1 rounded-full', done ? 'bg-primary' : 'bg-border')}
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** Bảng "Lịch trình 6 giai đoạn" — gấp lại được (xem ghi chú ở đầu file). */
function ScheduleTable({ project }: { project: SupervisionProject }) {
  const t = useTranslations('supervision.dashboard.schedule')
  const tStages = useTranslations('supervision.stages')
  const tStatus = useTranslations('supervision.dashboard.status')
  const locale = useLocale() as Locale
  const [open, setOpen] = useState(false)

  const short = (value?: string) => (value ? formatDate(value, locale, { day: '2-digit', month: '2-digit' }) : '—')

  return (
    <section className='bg-card rounded-2xl border'>
      <button
        type='button'
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className='flex w-full items-center justify-between gap-3 p-4 text-left'
      >
        <span className='flex items-center gap-2 font-semibold'>
          <CalendarClock className='text-primary size-4' />
          {t('title')}
        </span>
        <span className='text-muted-foreground inline-flex items-center gap-1.5 text-xs'>
          {open ? t('toggleOpen') : t('toggleClosed')}
          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      {open ? (
        <div className='px-4 pb-4'>
          <p className='text-muted-foreground mb-3 text-xs text-pretty'>
            {t('note', { days: STANDARD_SCHEDULE_DAYS })}
          </p>

          <div className='overflow-x-auto rounded-xl border'>
            <table className='w-full min-w-[640px] border-collapse text-sm'>
              <thead>
                <tr className='bg-primary text-primary-foreground text-xs'>
                  <th className='p-2.5 text-left font-medium'>{t('stage')}</th>
                  <th className='p-2.5 text-left font-medium'>{t('plan')}</th>
                  <th className='p-2.5 text-left font-medium'>{t('actual')}</th>
                  <th className='p-2.5 text-left font-medium'>{t('status')}</th>
                  <th className='p-2.5 text-left font-medium'>{t('files')}</th>
                </tr>
              </thead>
              <tbody>
                {project.stages.map((stage) => (
                  <tr key={stage.key} className='even:bg-muted/20'>
                    <td className='p-2.5 text-xs'>
                      <strong>{stage.index}.</strong> {tStages(stage.key)}
                    </td>
                    <td className='p-2.5 text-xs'>
                      {short(stage.plannedStart)} – {short(stage.plannedEnd)}
                    </td>
                    <td className='p-2.5 text-xs'>
                      {stage.actualStart ? `${short(stage.actualStart)} – ${short(stage.actualEnd)}` : t('notStarted')}
                    </td>
                    <td className='p-2.5 text-xs'>{tStatus(stage.status)}</td>
                    <td className='p-2.5 text-xs'>
                      {stage.files.length > 0 ? (
                        <>
                          {t('fileCount', { count: stage.files.length })} · {stage.version}
                        </>
                      ) : (
                        t('notStarted')
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  )
}

/** Nhãn trạng thái nhỏ trên thẻ giai đoạn ở cột trái. */
function StageStatusBadge({ stage }: { stage: SupervisionStage }) {
  const t = useTranslations('supervision.dashboard.status')

  return (
    <span
      className={cn(
        'rounded-md px-1.5 py-0.5 text-[10px] font-medium',
        stage.status === 'confirmed' && 'bg-primary/10 text-primary-strong',
        stage.status === 'inProgress' && 'bg-warning/20 text-warning-strong',
        stage.status === 'upcoming' && 'bg-muted text-muted-foreground'
      )}
    >
      {t(stage.status)}
    </span>
  )
}
