'use client'

import {
  BadgeCheck,
  Check,
  ChevronLeft,
  FileText,
  Headset,
  Info,
  Lock,
  Mail,
  Pencil,
  Phone,
  Star,
  UsersRound
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { EmptyState, revealContainerVariants, revealItemVariants } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import {
  contractorBriefRoute,
  contractorFirmRoute,
  contractorMatchesRoute,
  contractorReviewRoute,
  supervisionPlansRoute
} from '@/shared/constants/routes'
import { siteConfig } from '@/shared/config'
import { cn } from '@/shared/lib/utils'
import { formatDate } from '@/shared/utils'
import { INVITATION_STEPS, MAX_INVITATIONS } from '../constants/contractors.constants'
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
  const tCommon = useTranslations('contractors.common')
  const { data: brief } = useBrief(projectId)
  const { data: contractors } = useContractors(projectId)
  const { data: invitations, isPending } = useInvitations(projectId)
  const { data: reviews } = useContractorReviews(projectId)

  const [contactDialogOpen, setContactDialogOpen] = useState(false)

  const sent = invitations ?? []

  return (
    <div className='mx-auto w-[91%] max-w-[84rem] space-y-5 py-8'>
      <ProjectContextBar
        brief={brief}
        aside={
          brief ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={contractorBriefRoute(brief.id)}
                  className='text-primary hover:text-primary/80 inline-flex shrink-0 items-center gap-1.5 text-sm font-medium underline-offset-4 transition-colors hover:underline'
                >
                  <Pencil className='size-3.5' />
                  {tCommon('editBrief')}
                </Link>
              </TooltipTrigger>
              <TooltipContent>{t('editBriefWarning')}</TooltipContent>
            </Tooltip>
          ) : undefined
        }
      />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <Link
          href={contractorMatchesRoute(projectId)}
          className='text-primary-strong inline-flex items-center gap-1.5 text-sm font-medium'
        >
          {/* Bản mô tả S18 gọi đúng tên liên kết này là "Quay lại danh sách nhà
              thầu" — khác với nhãn của trạng thái rỗng ở dưới. */}
          <ChevronLeft className='size-4' />
          {t('back')}
        </Link>
      </motion.div>

      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className='flex flex-wrap items-center justify-between gap-3'
      >
        <div className='min-w-0'>
          <h1 className='text-2xl font-semibold tracking-tight'>{t('title')}</h1>
          <p className='text-muted-foreground mt-1 text-sm text-pretty'>{t('subtitle', { count: sent.length })}</p>
        </div>
        <motion.span
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.4 }}
          className='bg-card inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm'
        >
          <UsersRound className='text-primary size-4' />
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={sent.length}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25 }}
              className='inline-block'
            >
              {t.rich('counter', {
                used: sent.length,
                max: MAX_INVITATIONS,
                b: (chunks) => <b className='font-semibold'>{chunks}</b>
              })}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </motion.header>

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
        <div className='grid gap-x-[1.6%] gap-y-5 lg:grid-cols-[70.5%_minmax(0,1fr)]'>
          <motion.div variants={revealContainerVariants} initial='hidden' animate='show' className='min-w-0 space-y-4'>
            {sent.map((invitation) => (
              <motion.div variants={revealItemVariants} key={invitation.id}>
                <InvitationCard
                  invitation={invitation}
                  contractor={contractors?.find((c) => c.id === invitation.contractorId)}
                  projectId={projectId}
                  review={reviews?.find((item) => item.invitationId === invitation.id)}
                />
              </motion.div>
            ))}

            <p className='text-muted-foreground bg-muted/50 flex items-start gap-2.5 rounded-xl p-4 text-sm'>
              <Info className='mt-0.5 size-4 shrink-0' />
              <span className='text-pretty'>{t('footerNote')}</span>
            </p>
          </motion.div>

          <aside className='space-y-4 lg:sticky lg:top-24 lg:self-start'>
            <StatusLegend statuses={sent.map((invitation) => invitation.status)} />
            <SentDossier projectId={projectId} version={sent[0]?.dossierVersion ?? 'v1'} />

            <section className='bg-accent/40 flex gap-3 rounded-2xl p-4'>
              <Headset className='text-primary mt-0.5 size-5 shrink-0' />
              <div className='min-w-0'>
                <h2 className='text-primary-strong font-semibold'>{t('supportTitle')}</h2>
                <p className='text-muted-foreground mt-1 text-sm text-pretty'>{t('supportBody')}</p>
                <button
                  type='button'
                  onClick={() => setContactDialogOpen(true)}
                  className='text-primary-strong mt-2 text-sm font-medium underline underline-offset-4'
                >
                  {t('supportAction')}
                </button>
              </div>
            </section>
          </aside>
        </div>
      )}

      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>{t('contactDialogTitle')}</DialogTitle>
          </DialogHeader>
          <div className='space-y-2.5 text-sm'>
            <a
              href={`tel:${siteConfig.contact.hotline.replace(/\s/g, '')}`}
              className='hover:bg-accent flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors'
            >
              <Phone className='text-primary size-4 shrink-0' />
              {siteConfig.contact.hotline}
            </a>
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className='hover:bg-accent flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors'
            >
              <Mail className='text-primary size-4 shrink-0' />
              {siteConfig.contact.email}
            </a>
          </div>
          <DialogFooter>
            <Button asChild className='w-full'>
              <a href={`tel:${siteConfig.contact.hotline.replace(/\s/g, '')}`}>{t('contactDialogCall')}</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Giá trị in đậm trong các chuỗi "Mã lời mời <b>…</b>" của hàng siêu dữ liệu. */
const strong = (chunks: React.ReactNode) => <b className='text-foreground font-medium'>{chunks}</b>

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
  const isDone = invitation.status === 'done'

  /**
   * Ảnh S18 ghi mốc thời gian dạng "10:42 · 26/08/2026" và "26/08 · 10:42" —
   * `Intl` không có mẫu nào ra đúng thứ tự đó, nên giờ và ngày được định dạng
   * rời rồi ghép lại.
   */
  const clock = { hour: '2-digit', minute: '2-digit' } as const
  const fullDate = { day: '2-digit', month: '2-digit', year: 'numeric' } as const

  const sentStamp = `${formatDate(invitation.sentAt, locale, clock)} · ${formatDate(invitation.sentAt, locale, fullDate)}`
  // `Intl` tiếng Việt trả "08-09" cho cặp ngày/tháng, còn ảnh S18 in "26/08" —
  // mốc trên thanh trạng thái ghép tay để đúng mẫu đó.
  const stepStamp = (at: string) => {
    const day = new Date(at)
    const dayMonth = `${String(day.getDate()).padStart(2, '0')}/${String(day.getMonth() + 1).padStart(2, '0')}`
    return `${dayMonth} · ${formatDate(at, locale, clock)}`
  }

  return (
    <article
      className={cn('bg-card relative space-y-4 overflow-hidden rounded-2xl border p-4 sm:p-5', isDone && 'pt-5')}
    >
      {/* "Hoàn tất" → dải trên xanh (mục 6). */}
      {isDone ? <span aria-hidden className='bg-primary absolute inset-x-0 top-0 h-1' /> : null}

      <div className='flex flex-wrap items-start gap-4'>
        {contractor ? <ContractorLogo contractor={contractor} className='size-14 rounded-lg' /> : null}

        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='font-semibold'>{contractor?.name ?? invitation.contractorId}</h2>
            {contractor?.verified ? <BadgeCheck className='text-primary size-4' /> : null}
          </div>
          {contractor ? (
            <>
              <p className='text-muted-foreground mt-0.5 text-sm'>
                {contractor.kind} · {contractor.officeAddress}
              </p>
              <ContractorStats contractor={contractor} dense className='mt-1.5' />
            </>
          ) : null}
        </div>

        <div className='flex shrink-0 flex-wrap items-center gap-2'>
          {/* Nấc chờ nhà thầu tô CAM chứ không xanh: đây là nấc duy nhất bóng
              đang ở phía nhà thầu, khách nhìn màu là biết chưa xong. Chấm nhấp
              chậm khi còn đang chờ, đứng yên khi đã hoàn tất (mục 5). */}
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium',
              invitation.status === 'received'
                ? 'bg-warning/15 text-warning-strong'
                : 'bg-primary/10 text-primary-strong'
            )}
          >
            <span
              aria-hidden
              className={cn(
                'size-1.5 rounded-full',
                invitation.status === 'received' ? 'bg-warning-strong' : 'bg-primary',
                !isDone && 'animate-pulse'
              )}
            />
            {invitation.status === 'received' ? tStatus('receivedWaiting') : tStatus(invitation.status)}
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

      <div className='text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-1.5 border-t pt-3 text-sm'>
        <span>{t.rich('code', { code: invitation.id, b: strong })}</span>
        <span>{t.rich('sentAt', { time: sentStamp, b: strong })}</span>
        <span>{t.rich('dossier', { version: invitation.dossierVersion, count: invitation.fileCount, b: strong })}</span>
        <span className='sm:ml-auto'>
          {t('updatedBy', { time: formatDate(invitation.updatedAt, locale, fullDate) })}
        </span>
      </div>

      {/* Thanh 4 nấc: nấc đã qua tô đặc, nấc hiện tại viền đậm, nấc chưa tới mờ. */}
      <ol className='flex items-start'>
        {INVITATION_STEPS.map((status, index) => {
          const done = index < currentIndex
          const active = index === currentIndex
          const at = stampOf(status)

          return (
            <motion.li
              key={status}
              whileHover={{ scale: 1.06 }}
              className='relative flex min-w-0 flex-1 flex-col gap-2'
            >
              {/* Đường nối do nấc SAU vẽ, kéo từ tâm nấc trước sang tâm nấc này.
                  Để nó là phần tử anh em `flex-1` như trước thì nấc cuối — nấc
                  duy nhất không có đường nối — rộng hơn hẳn ba nấc kia. */}
              {/* Đường nối kéo từ tâm nấc trước tới tâm nấc này. Nhãn canh
                  TRÁI dưới từng chấm, đúng ảnh S18. */}
              {index > 0 ? (
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-3 right-full left-0 h-0.5 -translate-y-1/2 rounded-full',
                    done || active ? 'bg-primary' : 'bg-border'
                  )}
                  style={{ left: 'calc(-100% + 1.5rem)', right: 'calc(100% - 0.75rem)' }}
                />
              ) : null}

              <span
                className={cn(
                  'relative z-10 flex size-6 items-center justify-center rounded-full border-2',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary bg-card',
                  !done && !active && 'border-border bg-card'
                )}
              >
                {/* Quầng "thở" hai nhịp rồi đứng yên ở nấc hiện tại (mục 6). */}
                {active ? (
                  <motion.span
                    aria-hidden
                    initial={{ opacity: 0.6, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.8 }}
                    transition={{ duration: 0.9, repeat: 1, repeatType: 'loop' }}
                    className='border-primary absolute inset-0 -z-10 rounded-full border-2'
                  />
                ) : null}
                {done ? (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.6, duration: 0.35, delay: index * 0.1 }}
                  >
                    <Check className='size-3.5' strokeWidth={3} />
                  </motion.span>
                ) : null}
                {active ? <span aria-hidden className='bg-primary size-2 rounded-full' /> : null}
              </span>

              <div className='min-w-0'>
                <p
                  className={cn(
                    'text-sm leading-tight',
                    done && 'font-medium',
                    active && 'text-primary-strong font-medium',
                    !done && !active && 'text-muted-foreground'
                  )}
                >
                  {tStatus(status)}
                </p>
                {/* Nấc chưa tới KHÔNG in gạch ngang: mốc chưa xảy ra thì để
                    trống, vẽ "—" chỉ làm cột thời gian trông như bị lỗi. */}
                {at ? <p className='text-muted-foreground mt-0.5 text-sm'>{stepStamp(at)}</p> : null}
              </div>
            </motion.li>
          )
        })}
      </ol>

      {/* Hoàn tất → gợi ý "Chọn cách quản lý thi công", trượt lên + một nhịp
          thở rồi im (mục 6). */}
      {isDone ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, scale: [1, 1.015, 1] }}
          transition={{ opacity: { duration: 0.4 }, y: { duration: 0.4 }, scale: { duration: 0.5, delay: 0.4 } }}
          className='bg-accent/40 flex flex-wrap items-center justify-between gap-3 rounded-xl p-3.5 text-sm'
        >
          <span className='text-primary-strong font-medium'>{t('supervisionSuggestion')}</span>
          <Button asChild size='sm' variant='outline'>
            <Link href={supervisionPlansRoute(projectId)}>{t('supervisionAction')}</Link>
          </Button>
        </motion.div>
      ) : null}

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

/**
 * Cột phải: giải thích 4 trạng thái (S18).
 *
 * Dòng ứng với trạng thái hiện tại nền xanh nhạt (mục 8) — chỉ khi TẤT CẢ lời
 * mời đang ở cùng một trạng thái; nhiều lời mời ở nhiều trạng thái khác nhau
 * thì không tô dòng nào để khỏi ngầm chỉ sai một trạng thái.
 */
function StatusLegend({ statuses }: { statuses: Invitation['status'][] }) {
  const t = useTranslations('contractors.invitations')
  const tStatus = useTranslations('contractors.status')
  const tMeaning = useTranslations('contractors.statusMeaning')

  const uniqueStatuses = new Set(statuses)
  const currentStatus = uniqueStatuses.size === 1 ? [...uniqueStatuses][0] : null

  return (
    <section className='bg-card rounded-2xl border p-4'>
      <h2 className='font-semibold'>{t('meaningTitle')}</h2>
      <dl className='mt-3 space-y-2.5 text-sm'>
        {INVITATION_STEPS.map((status, index) => (
          <div key={status} className='relative isolate flex gap-2.5'>
            {/* Nền xanh nhạt của dòng hiện tại — overlay riêng, không đổi đệm
                hay lề của hàng ở trạng thái nghỉ (mục 8). */}
            {status === currentStatus ? (
              <span aria-hidden className='bg-accent/60 absolute -inset-x-1.5 -inset-y-0.5 -z-10 rounded-lg' />
            ) : null}
            <span
              aria-hidden
              className={cn(
                'mt-2 size-1.5 shrink-0 rounded-full',
                index === INVITATION_STEPS.length - 1 ? 'bg-muted-foreground/40' : 'bg-primary'
              )}
            />
            <div className='text-muted-foreground min-w-0 text-pretty'>
              <dt className='text-foreground inline font-semibold'>{tStatus(status)}</dt>
              <dd className='inline'> – {tMeaning(status)}</dd>
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
        <h2 className='font-semibold'>{t('dossierTitle')}</h2>
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className='border-primary/40 text-primary-strong rounded-md border px-1.5 py-0.5 text-[10px] font-medium'
        >
          {version}
        </motion.span>
      </div>

      <dl className='mt-3 space-y-2.5 text-sm'>
        {rows.map((row) => (
          <div key={row.label} className='flex items-start justify-between gap-3'>
            <dt className='text-muted-foreground'>{row.label}</dt>
            <dd className='text-right font-medium'>{row.value}</dd>
          </div>
        ))}
      </dl>

      {/* Doc S18: cột phải có link mở lại đúng hồ sơ đã gửi kèm lời mời. */}
      <Link
        href={contractorReviewRoute(projectId)}
        className='text-primary-strong mt-3 inline-block text-sm font-medium underline underline-offset-4'
      >
        {t('dossierView')}
      </Link>

      <p className='text-muted-foreground bg-muted/50 mt-3 flex items-start gap-2 rounded-lg p-3 text-sm'>
        <Lock className='mt-0.5 size-3.5 shrink-0' />
        <span>{t('dossierNoBudget')}</span>
      </p>
    </section>
  )
}
