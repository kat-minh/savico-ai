'use client'

import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Check,
  FileText,
  HardHat,
  Headset,
  Info,
  Lock,
  Star
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { EmptyState } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
  contractorFirmRoute,
  contractorMatchesRoute,
  contractorReviewRoute,
  supervisionPlansRoute
} from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { formatDate } from '@/shared/utils'
import { INVITATION_STEPS, MAX_INVITATIONS, SURVEY_SLOTS } from '../constants/contractors.constants'
import { useBrief } from '../hooks/use-brief'
import { useContractors } from '../hooks/use-contractors'
import { useContractorReviews, useInvitations } from '../hooks/use-invitations'
import type { Contractor, ContractorReview, Invitation } from '../types/contractor.types'
import { ContractorReviewDialog } from './contractor-review-dialog'
import { ContractorLogo } from './contractor-logo'
import { ContractorStats } from './contractor-stats'
import { ProjectContextBar } from './project-context-bar'

interface InvitationTrackerProps {
  projectId: string
}

/**
 * Lời mời báo giá — theo dõi lời mời đã gửi (S18).
 *
 * R4: khách CHỈ XEM. Không có nút đổi lịch, hủy lời mời hay nhập trạng thái —
 * mọi thay đổi đi qua đội hỗ trợ, nên màn này nói rõ điều đó thay vì bày ra
 * những nút không làm gì.
 *
 * R2/R3: không có số tiền, không có bảng so sánh báo giá. Bổ sung so với bản mô
 * tả: mỗi thẻ hiện luôn LỊCH KHẢO SÁT đã đặt — sau S17 thì đây là chỗ duy nhất
 * khách xem lại được mình đã hẹn nhà thầu lúc nào.
 */
export function InvitationTracker({ projectId }: InvitationTrackerProps) {
  const t = useTranslations('contractors.invitations')
  const tSupervision = useTranslations('supervision.account')
  const { data: brief } = useBrief(projectId)
  const { data: contractors } = useContractors(projectId)
  const { data: invitations, isPending } = useInvitations(projectId)
  const { data: reviews } = useContractorReviews(projectId)

  const sent = invitations ?? []

  return (
    <div className='mx-auto w-full max-w-6xl space-y-5 px-4 py-8 lg:px-8'>
      <ProjectContextBar brief={brief} />

      <Link
        href={contractorMatchesRoute(projectId)}
        className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm'
      >
        ← {t('emptyAction')}
      </Link>

      <header className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>{t('title')}</h1>
          <p className='text-muted-foreground mt-1 text-sm text-pretty'>{t('subtitle', { count: sent.length })}</p>
        </div>
        <span className='bg-card inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium'>
          {t('counter', { used: sent.length, max: MAX_INVITATIONS })}
        </span>
      </header>

      {isPending ? (
        <Skeleton className='h-72 rounded-2xl' />
      ) : sent.length === 0 ? (
        <EmptyState
          title={t('empty')}
          action={
            <Button asChild>
              <Link href={contractorMatchesRoute(projectId)}>{t('emptyAction')}</Link>
            </Button>
          }
        />
      ) : (
        <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]'>
          <div className='min-w-0 space-y-4'>
            {sent.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                contractor={contractors?.find((c) => c.id === invitation.contractorId)}
                projectId={projectId}
                review={reviews?.find((item) => item.invitationId === invitation.id)}
              />
            ))}

            <p className='text-muted-foreground flex items-start gap-2 rounded-xl border border-dashed p-4 text-xs'>
              <Info className='text-primary mt-0.5 size-4 shrink-0' />
              <span className='text-pretty'>{t('footerNote')}</span>
            </p>
          </div>

          <aside className='space-y-4 lg:sticky lg:top-24 lg:self-start'>
            <StatusLegend />
            <SentDossier projectId={projectId} version={sent[0]?.dossierVersion ?? 'v1'} />

            {/* R8 — sau khảo sát, đây là chỗ khách chọn cách quản lý thi công.
                Link THẲNG tới tab Gói giám sát, không popup, không trang riêng. */}
            <section className='border-warning/40 bg-warning/10 rounded-2xl border p-4'>
              <h2 className='flex items-center gap-2 text-sm font-semibold'>
                <HardHat className='text-warning-strong size-4' />
                {tSupervision('chooseManagement')}
              </h2>
              <p className='text-muted-foreground mt-2 text-xs text-pretty'>{tSupervision('selfManaged')}</p>
              <Button asChild size='sm' className='mt-3 w-full'>
                <Link href={supervisionPlansRoute(projectId)}>{tSupervision('chooseManagement')}</Link>
              </Button>
            </section>

            <section className='bg-accent/40 rounded-2xl border p-4'>
              <h2 className='flex items-center gap-2 text-sm font-semibold'>
                <Headset className='text-primary size-4' />
                {t('supportTitle')}
              </h2>
              <p className='text-muted-foreground mt-2 text-xs text-pretty'>{t('supportBody')}</p>
              <Button variant='outline' size='sm' className='mt-3 w-full' onClick={() => toast.info(t('supportToast'))}>
                {t('supportAction')}
              </Button>
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}

/** Một thẻ lời mời: thông tin nhà thầu, mốc hồ sơ và thanh 4 nấc trạng thái. */
function InvitationCard({
  invitation,
  contractor,
  projectId,
  review
}: {
  invitation: Invitation
  contractor?: Contractor
  projectId: string
  /** Đánh giá đã gửi cho chính lời mời này, nếu có. */
  review?: ContractorReview
}) {
  const t = useTranslations('contractors.invitations')
  const tCommon = useTranslations('contractors.common')
  const tStatus = useTranslations('contractors.status')
  const tRating = useTranslations('contractors.rating')
  const locale = useLocale() as Locale

  const [reviewOpen, setReviewOpen] = useState(false)

  const currentIndex = INVITATION_STEPS.indexOf(invitation.status)
  const stampOf = (status: string) => invitation.steps.find((step) => step.status === status)?.at

  const timeFormat = { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' } as const
  const slot = SURVEY_SLOTS[Number(invitation.survey.slotId.replace('slot-', ''))]

  return (
    <article className='bg-card space-y-4 rounded-2xl border p-4 sm:p-5'>
      <div className='flex flex-wrap items-start gap-4'>
        {contractor ? <ContractorLogo contractor={contractor} className='size-12' /> : null}

        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='font-semibold'>{contractor?.name ?? invitation.contractorId}</h2>
            {contractor?.verified ? <BadgeCheck className='text-primary size-4' /> : null}
          </div>
          {contractor ? <ContractorStats contractor={contractor} dense className='mt-1.5' /> : null}
        </div>

        <div className='flex shrink-0 flex-wrap items-center gap-2'>
          <span className='bg-accent text-primary-strong rounded-md px-2.5 py-1 text-xs font-medium'>
            {tStatus(invitation.status)}
          </span>
          {contractor ? (
            <Button asChild variant='outline' size='sm'>
              <Link href={contractorFirmRoute(projectId, contractor.id)}>
                <FileText className='size-4' />
                {tCommon('viewProfile')}
              </Link>
            </Button>
          ) : null}

          {/* S09 hứa "chỉ khách đã làm việc qua SAVICO mới được đánh giá" — nên
              nút chỉ hiện khi lời mời đã ở nấc cuối, và biến mất sau khi đánh
              giá xong (mỗi lời mời một lần). */}
          {invitation.status === 'done' && contractor ? (
            review ? (
              <span className='text-warning-strong inline-flex items-center gap-1.5 text-xs font-medium'>
                <Star className='fill-warning text-warning size-3.5' />
                {tRating('done', { rating: review.rating })}
              </span>
            ) : (
              <Button variant='outline' size='sm' onClick={() => setReviewOpen(true)}>
                <Star className='size-4' />
                {tRating('action')}
              </Button>
            )
          ) : null}
        </div>
      </div>

      <div className='text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t pt-3 text-xs'>
        <span className='text-foreground font-medium'>{t('code', { code: invitation.id })}</span>
        <span>{t('sentAt', { time: formatDate(invitation.sentAt, locale, timeFormat) })}</span>
        <span>{t('dossier', { version: invitation.dossierVersion, count: invitation.fileCount })}</span>
        <span className='inline-flex items-center gap-1.5'>
          <CalendarCheck className='size-3.5' />
          {t('surveyAt', {
            date: formatDate(invitation.survey.date, locale, { day: '2-digit', month: '2-digit' }),
            slot: slot ?? ''
          })}
        </span>
        <span>{t('updatedBy', { time: formatDate(invitation.updatedAt, locale, timeFormat) })}</span>
      </div>

      {/* Thanh 4 nấc: nấc đã qua tô đặc, nấc hiện tại viền đậm, nấc chưa tới mờ. */}
      <ol className='flex items-start'>
        {INVITATION_STEPS.map((status, index) => {
          const done = index < currentIndex
          const active = index === currentIndex
          const at = stampOf(status)

          return (
            <li key={status} className='relative flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center'>
              {/* Đường nối do nấc SAU vẽ, kéo từ tâm nấc trước sang tâm nấc này.
                  Để nó là phần tử anh em `flex-1` như trước thì nấc cuối — nấc
                  duy nhất không có đường nối — rộng hơn hẳn ba nấc kia. */}
              {index > 0 ? (
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-3 -left-1/2 h-0.5 w-full rounded-full',
                    done || active ? 'bg-primary' : 'bg-border'
                  )}
                />
              ) : null}

              <div className='flex min-w-0 flex-col items-center gap-1.5'>
                <span
                  className={cn(
                    'relative z-10 flex size-6 items-center justify-center rounded-full border-2 text-[10px] font-semibold',
                    done && 'border-primary bg-primary text-primary-foreground',
                    active && 'border-primary text-primary-strong bg-card',
                    !done && !active && 'border-border text-muted-foreground bg-card'
                  )}
                >
                  {done ? <Check className='size-3.5' strokeWidth={3} /> : index + 1}
                </span>
                <span
                  className={cn('text-[11px] leading-tight', active || done ? 'font-medium' : 'text-muted-foreground')}
                >
                  {tStatus(status)}
                </span>
                <span className='text-muted-foreground text-[10px]'>
                  {at ? formatDate(at, locale, timeFormat) : '—'}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
      {contractor ? (
        <ContractorReviewDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          projectId={projectId}
          invitationId={invitation.id}
          contractorName={contractor.name}
        />
      ) : null}
    </article>
  )
}

/** Cột phải: giải thích 4 trạng thái (S18). */
function StatusLegend() {
  const t = useTranslations('contractors.invitations')
  const tStatus = useTranslations('contractors.status')
  const tMeaning = useTranslations('contractors.statusMeaning')

  return (
    <section className='bg-card rounded-2xl border p-4'>
      <h2 className='text-sm font-semibold'>{t('meaningTitle')}</h2>
      <dl className='mt-3 space-y-2.5'>
        {INVITATION_STEPS.map((status) => (
          <div key={status} className='flex gap-2.5'>
            <span aria-hidden className='bg-primary mt-1.5 size-1.5 shrink-0 rounded-full' />
            <div className='min-w-0'>
              <dt className='text-xs font-medium'>{tStatus(status)}</dt>
              <dd className='text-muted-foreground text-xs'>{tMeaning(status)}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}

/**
 * Cột phải: hồ sơ đã gửi kèm lời mời.
 *
 * Ngân sách khách nhập ở Bước 1 KHÔNG nằm trong danh sách này — bản mô tả nói rõ
 * hồ sơ gửi đi không chứa thông tin giá, nên chỗ này liệt kê đúng những trường
 * nhà thầu nhận được, kèm dòng ghi chú để khách biết ngân sách của mình không bị
 * chuyển đi.
 */
function SentDossier({ projectId, version }: { projectId: string; version: string }) {
  const t = useTranslations('contractors.invitations')
  const tScope = useTranslations('contractors.scope')
  const tScale = useTranslations('contractors.scale')
  const { data: brief } = useBrief(projectId)

  if (!brief) return null

  const rows = [
    { label: t('dossierType'), value: brief.buildingType },
    { label: t('dossierScale'), value: `${tScale(brief.scale)} · ${brief.landArea} m²` },
    { label: t('dossierScope'), value: tScope(brief.scope) },
    { label: t('dossierFiles'), value: t('dossierFileCount', { count: brief.documents.length }) }
  ]

  return (
    <section className='bg-card rounded-2xl border p-4'>
      <div className='flex items-center justify-between gap-2'>
        <h2 className='text-sm font-semibold'>{t('dossierTitle')}</h2>
        <span className='border-primary/40 text-primary-strong rounded-md border px-1.5 py-0.5 text-[10px] font-medium'>
          {version}
        </span>
      </div>

      <dl className='mt-3 space-y-2 text-sm'>
        {rows.map((row) => (
          <div key={row.label} className='flex items-start justify-between gap-3'>
            <dt className='text-muted-foreground text-xs'>{row.label}</dt>
            <dd className='text-right text-xs font-medium'>{row.value}</dd>
          </div>
        ))}
      </dl>

      {/* Doc S18: cột phải có link mở lại đúng hồ sơ đã gửi kèm lời mời. */}
      <Link
        href={contractorReviewRoute(projectId)}
        className='text-primary hover:text-primary/80 mt-3 inline-flex items-center gap-1.5 text-xs font-medium'
      >
        {t('dossierView')}
        <ArrowRight className='size-3.5' />
      </Link>

      <p className='text-muted-foreground bg-muted/50 mt-3 flex items-start gap-2 rounded-lg p-2.5 text-xs'>
        <Lock className='mt-0.5 size-3.5 shrink-0' />
        <span>{t('dossierNoBudget')}</span>
      </p>
    </section>
  )
}
