'use client'

import { CheckCircle2, FilePlus2, FileText, House, Inbox, MoreHorizontal, Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link, useRouter } from '@/i18n/navigation'
import { Photo } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/shared/components/ui/dropdown-menu'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
  contractorBriefRoute,
  contractorInvitationsRoute,
  contractorMatchesRoute,
  contractorReviewRoute,
  ROUTES
} from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { MAX_INVITATIONS } from '../constants/contractors.constants'
import { useBriefSummaries } from '../hooks/use-brief-summaries'
import { useCreateBrief } from '../hooks/use-brief'
import { shortAddress } from '../services/brief.service'
import { useProjectPickerStore } from '../store/project-picker.store'
import type { ProjectBriefSummary } from '../types/contractor.types'

interface ProjectPickerDialogProps {
  /**
   * Dự án đang mở; dòng của nó hiện "Đang chọn" thay vì nút "Chọn". Bỏ trống khi
   * đang ở chế độ xem thử — lúc đó chưa có dự án nào được chọn.
   */
  currentProjectId?: string
}

/**
 * Hộp thoại "Chọn dự án để tìm nhà thầu".
 *
 * Danh sách nhà thầu xem được mà không cần hồ sơ, nhưng MỜI thì phải gắn vào một
 * dự án (R1: mỗi dự án tối đa 3 lời mời). Hộp thoại này là chỗ duy nhất trong
 * luồng làm việc đó — mở từ dải "Bạn đang xem thử" ở S12, từ nút "Đổi dự án"
 * trên thẻ dự án, và từ các nút mời khi đang xem thử.
 *
 * Mỗi dòng nói luôn dự án đang ở đâu: chưa mời ai, đã mời mấy trên ba, hay đã
 * đủ ba — đủ ba thì không mời thêm được nữa nên nút đổi thành "Xem lời mời"
 * chứ không phải một nút "Chọn" bấm vào rồi mới báo hết chỗ.
 */
export function ProjectPickerDialog({ currentProjectId }: ProjectPickerDialogProps) {
  const t = useTranslations('contractors.picker')
  const tCommon = useTranslations('contractors.common')
  const tScale = useTranslations('contractors.scale')

  const router = useRouter()
  const open = useProjectPickerStore((s) => s.open)
  const close = useProjectPickerStore((s) => s.closePicker)

  const { data: summaries, isPending } = useBriefSummaries()
  const createBrief = useCreateBrief()

  function choose(projectId: string) {
    close()
    router.push(contractorMatchesRoute(projectId))
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className='sm:max-w-[52rem]'>
        <DialogHeader className='items-center text-center'>
          <DialogTitle className='text-2xl'>{t('title')}</DialogTitle>
          <DialogDescription className='text-pretty'>{t('subtitle', { max: MAX_INVITATIONS })}</DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className='space-y-3'>
            {[0, 1].map((index) => (
              <Skeleton key={index} className='h-24 rounded-xl' />
            ))}
          </div>
        ) : !summaries?.length ? (
          <EmptyBriefs onCreate={() => createBrief.mutate()} pending={createBrief.isPending} />
        ) : (
          <>
            <ul className='max-h-[52vh] space-y-3 overflow-y-auto'>
              {summaries.map((summary) => (
                <li key={summary.brief.id}>
                  <BriefRow
                    summary={summary}
                    current={summary.brief.id === currentProjectId}
                    onChoose={() => choose(summary.brief.id)}
                    onNavigate={close}
                    labels={{
                      scale: tScale(summary.brief.scale),
                      untitled: t('untitled'),
                      selfCreated: tCommon('selfCreated'),
                      fromPlan: t('fromPlan'),
                      notInvited: t('notInvited'),
                      invited: t('invitedCount', { used: summary.invitedCount, max: MAX_INVITATIONS }),
                      contracted: t('contracted'),
                      choose: t('choose'),
                      current: t('current'),
                      viewInvites: t('viewInvites'),
                      menu: t('rowMenu'),
                      edit: tCommon('editBrief'),
                      view: t('viewBrief')
                    }}
                  />
                </li>
              ))}
            </ul>

            {/* Hình 3: khi mới có đúng một dự án, khoảng trống bên dưới nói rõ
                "chưa có dự án khác" thay vì để hộp thoại hụt một mảng trắng. */}
            {summaries.length === 1 ? (
              <div className='text-muted-foreground flex flex-col items-center gap-2 py-6 text-sm'>
                <Inbox className='size-6' />
                {t('noOther')}
              </div>
            ) : null}
          </>
        )}

        {summaries?.length ? (
          <div className='flex flex-wrap items-center justify-between gap-3 border-t pt-4'>
            <Button variant='outline' onClick={() => createBrief.mutate()} disabled={createBrief.isPending}>
              <FilePlus2 className='size-4' />
              {t('createMore')}
            </Button>
            <Link
              href={ROUTES.PLANS}
              onClick={close}
              className='text-primary hover:text-primary/80 text-sm font-medium underline underline-offset-4'
            >
              {t('buyPlan')}
            </Link>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

/** Trạng thái rỗng (Hình 2) — chưa có hồ sơ dự án nào. */
function EmptyBriefs({ onCreate, pending }: { onCreate: () => void; pending: boolean }) {
  const t = useTranslations('contractors.picker')
  const close = useProjectPickerStore((s) => s.closePicker)

  return (
    <div className='flex flex-col items-center gap-4 py-4 text-center'>
      <span className='border-primary/40 bg-accent text-primary-strong rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide uppercase'>
        {t('emptyBadge')}
      </span>

      <EmptyIllustration />

      <div className='space-y-1'>
        <p className='text-lg font-semibold'>{t('emptyTitle')}</p>
        <p className='text-muted-foreground text-sm text-pretty'>{t('emptyDescription')}</p>
      </div>

      <div className='flex flex-wrap justify-center gap-3'>
        <Button onClick={onCreate} disabled={pending}>
          {t('createFirst')}
        </Button>
        <Button asChild variant='outline'>
          <Link href={ROUTES.PLANS} onClick={close}>
            {t('viewPlans')}
          </Link>
        </Button>
      </div>

      <p className='text-muted-foreground text-xs'>{t('emptyFootnote', { max: MAX_INVITATIONS })}</p>
    </div>
  )
}

interface BriefRowLabels {
  scale: string
  untitled: string
  selfCreated: string
  fromPlan: string
  notInvited: string
  invited: string
  contracted: string
  choose: string
  current: string
  viewInvites: string
  menu: string
  edit: string
  view: string
}

/** Một dòng dự án trong hộp thoại (Hình 3, Hình 4). */
function BriefRow({
  summary,
  current,
  onChoose,
  onNavigate,
  labels
}: {
  summary: ProjectBriefSummary
  current: boolean
  onChoose: () => void
  onNavigate: () => void
  labels: BriefRowLabels
}) {
  const { brief, invitedCount } = summary
  const contracted = brief.status === 'contracted'
  const full = invitedCount >= MAX_INVITATIONS

  return (
    // Đã chốt thầu thì dòng LÀM MỜ và bỏ hẳn nút hành động: dự án đó xong việc
    // tìm nhà thầu rồi, để nút "Chọn" ở đấy là mời khách đi vào ngõ cụt.
    <article
      className={cn(
        'flex flex-wrap items-center gap-4 rounded-xl border p-3 transition-colors',
        contracted && 'bg-muted/40 opacity-60',
        !contracted && current && 'border-primary bg-primary/5',
        !contracted && !current && 'bg-card'
      )}
    >
      {/* Hình 3/4: ảnh bìa nằm ngoài cùng bên trái, khổ ngang ~4:3. Hồ sơ chưa
          có ảnh thì để khung biểu tượng chứ không bỏ trống — bỏ trống làm cả
          dòng lệch so với những dòng có ảnh. */}
      {brief.coverUrl ? (
        <Photo className='aspect-4/3 w-28 shrink-0 rounded-lg' src={brief.coverUrl} alt={brief.name} sizes='112px' />
      ) : (
        <span className='bg-accent text-primary/50 flex aspect-4/3 w-28 shrink-0 items-center justify-center rounded-lg'>
          <House className='size-8' strokeWidth={1.25} />
        </span>
      )}

      <div className='min-w-0 flex-1'>
        {/* Hồ sơ vừa tạo mà chưa điền gì thì `name` rỗng — không có nhãn dự
            phòng, dòng chỉ còn mã dự án và trông như bị mất chữ. */}
        <p className='flex items-center gap-2 font-semibold'>
          {current ? <CheckCircle2 className='text-primary size-4 shrink-0' /> : null}
          <span className={cn('truncate', !brief.name.trim() && 'text-muted-foreground font-normal italic')}>
            {brief.name.trim() || labels.untitled}
          </span>
        </p>
        <p className='text-muted-foreground font-mono text-xs'>{brief.id}</p>
        <p className='text-muted-foreground truncate text-xs'>
          {[brief.buildingType, labels.scale, shortAddress(brief)].filter(Boolean).join(' · ')}
        </p>

        <div className='mt-1.5 flex flex-wrap items-center gap-2'>
          <span className='bg-accent text-primary-strong rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase'>
            {brief.selfCreated ? labels.selfCreated : labels.fromPlan}
          </span>
          <span
            className={cn(
              'rounded-md px-2 py-0.5 text-[11px] font-medium',
              (contracted || invitedCount === 0) && 'bg-muted text-muted-foreground',
              !contracted && invitedCount > 0 && !full && 'bg-info-soft text-info',
              !contracted && full && 'bg-accent text-primary-strong'
            )}
          >
            {contracted ? labels.contracted : invitedCount === 0 ? labels.notInvited : labels.invited}
          </span>
        </div>
      </div>

      <div className='flex shrink-0 items-center gap-2'>
        {contracted ? null : current ? (
          // Hình 4: "Đang chọn" là VIÊN NHÃN chứ không phải nút — dòng này đang
          // được chọn sẵn nên chẳng có gì để bấm; dựng thành nút (kể cả nút đã
          // khoá) là mời người ta bấm vào một thứ không phản hồi.
          <span className='bg-accent text-primary-strong rounded-md px-3 py-2 text-sm font-medium'>
            {labels.current}
          </span>
        ) : full ? (
          // Đủ 3 lời mời thì không còn gì để mời — dẫn thẳng sang màn theo dõi
          // thay vì cho bấm "Chọn" rồi mới báo hết chỗ (R1).
          <Button asChild variant='outline'>
            <Link href={contractorInvitationsRoute(brief.id)} onClick={onNavigate}>
              {labels.viewInvites}
            </Link>
          </Button>
        ) : (
          <>
            <Button onClick={onChoose}>{labels.choose}</Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={labels.menu}
                className='text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-md transition-colors'
              >
                <MoreHorizontal className='size-4' />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem asChild>
                  <Link href={contractorBriefRoute(brief.id)} onClick={onNavigate}>
                    <Pencil className='size-4' />
                    {labels.edit}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={contractorReviewRoute(brief.id)} onClick={onNavigate}>
                    <FileText className='size-4' />
                    {labels.view}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </article>
  )
}

/**
 * Minh hoạ trạng thái rỗng (Hình 2): thư mục hồ sơ · mái nhà · tờ giấy đã tick,
 * đặt trên một vệt nền xanh nhạt.
 *
 * Vẽ bằng SVG chứ không tải ảnh: khối này thuần trang trí, chỉ dùng đúng một
 * lần trong hộp thoại, mà tải một tấm ảnh cho nó thì trạng thái rỗng lại phải
 * chờ mạng. Dùng `currentColor` để tự đổi theo màu chữ của chủ đề sáng / tối.
 */
function EmptyIllustration() {
  return (
    <svg viewBox='0 0 260 150' role='presentation' className='text-primary h-32 w-auto'>
      {/* Vệt nền mềm phía sau, mở rộng hơn hình khối để không cắt cụt ở mép. */}
      <ellipse cx='130' cy='96' rx='118' ry='46' className='fill-current opacity-10' />

      {/* Thư mục hồ sơ */}
      <path
        d='M28 58h34l9 11h46a8 8 0 0 1 8 8v44a8 8 0 0 1-8 8H28a8 8 0 0 1-8-8V66a8 8 0 0 1 8-8Z'
        className='fill-current opacity-20'
      />
      <path
        d='M28 58h34l9 11h46a8 8 0 0 1 8 8v44a8 8 0 0 1-8 8H28a8 8 0 0 1-8-8V66a8 8 0 0 1 8-8Z'
        className='stroke-current'
        strokeWidth='3'
        fill='none'
      />

      {/* Mái nhà ở giữa */}
      <path d='M96 84l34-26 34 26v41a6 6 0 0 1-6 6h-56a6 6 0 0 1-6-6V84Z' className='fill-white' />
      <path
        d='M96 84l34-26 34 26v41a6 6 0 0 1-6 6h-56a6 6 0 0 1-6-6V84Z'
        className='stroke-current'
        strokeWidth='3'
        fill='none'
        strokeLinejoin='round'
      />
      <path d='M118 131v-24h24v24' className='stroke-current' strokeWidth='3' fill='none' />

      {/* Tờ hồ sơ đã duyệt */}
      <rect x='176' y='50' width='60' height='76' rx='8' className='fill-white' />
      <rect x='176' y='50' width='60' height='76' rx='8' className='stroke-current' strokeWidth='3' fill='none' />
      <path d='M190 70h32M190 84h32M190 98h20' className='stroke-current' strokeWidth='3' strokeLinecap='round' />
      <circle cx='226' cy='110' r='16' className='fill-current' />
      <path
        d='M219 110l5 5 10-10'
        className='stroke-white'
        strokeWidth='3'
        fill='none'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
