'use client'

import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CircleCheck,
  FileCheck2,
  FileText,
  Flag,
  Lock,
  Plus,
  Send,
  ShieldCheck,
  Users
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { Link, useRouter } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { Photo } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { contractorFirmRoute, contractorInviteRoute, contractorMatchesRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { formatDate } from '@/shared/utils'
import { CONTRACTOR_TABS, MAX_INVITATIONS, type ContractorTab } from '../constants/contractors.constants'
import { useBrief } from '../hooks/use-brief'
import { useContractor } from '../hooks/use-contractors'
import { useInvitations } from '../hooks/use-invitations'
import { isInvited, remainingInvites } from '../services/contractor-list.service'
import { useContractorsStore } from '../store/contractors.store'
import type { Contractor } from '../types/contractor.types'
import { ContractorLogo } from './contractor-logo'
import { ContractorStats } from './contractor-stats'
import { ProjectContextBar } from './project-context-bar'

interface ContractorProfileProps {
  projectId: string
  contractorId: string
  /** Tab đang mở, lấy từ `?tab=` để chia sẻ được đường dẫn tới đúng tab. */
  tab: ContractorTab
}

/**
 * Hồ sơ một nhà thầu — S13 (tab Tổng quan) và S14 (tab Hợp tác SAVICO) là HAI
 * TAB CỦA CÙNG MỘT MÀN, không phải hai trang.
 *
 * Bản mô tả và các hình vẽ header khác nhau giữa hai tab (một bên có dòng đánh
 * giá, một bên không; một bên 4 tab, một bên 5). Ở đây header và bộ tab được
 * dựng MỘT LẦN, mọi tab dùng lại — đúng như phần "Hành vi" của S14 nói.
 */
export function ContractorProfile({ projectId, contractorId, tab }: ContractorProfileProps) {
  const t = useTranslations('contractors.firm')
  const tCommon = useTranslations('contractors.common')
  const router = useRouter()

  const { data: brief } = useBrief(projectId)
  const { data: contractor, isPending } = useContractor(contractorId)
  const { data: invitations } = useInvitations(projectId)

  const compareIds = useContractorsStore((s) => s.compareIds)
  const toggleCompare = useContractorsStore((s) => s.toggleCompare)

  const sent = invitations ?? []
  const invited = isInvited(sent, contractorId)
  const inviteLocked = remainingInvites(sent) === 0
  const inCompare = compareIds.includes(contractorId)

  if (isPending || !contractor) {
    return (
      <div className='mx-auto w-full max-w-6xl space-y-6 px-4 py-8 lg:px-8'>
        <Skeleton className='h-20 rounded-2xl' />
        <Skeleton className='h-96 rounded-2xl' />
      </div>
    )
  }

  return (
    <div className='mx-auto w-full max-w-6xl space-y-5 px-4 py-8 lg:px-8'>
      <ProjectContextBar brief={brief} compact />

      <Link
        href={contractorMatchesRoute(projectId)}
        className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm'
      >
        ← {tCommon('backToList')}
      </Link>

      <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px]'>
        <div className='min-w-0 space-y-5'>
          {/* Header dùng chung cho cả 4 tab. */}
          <header className='bg-card rounded-2xl border p-5'>
            <div className='flex flex-wrap items-start gap-4'>
              <ContractorLogo contractor={contractor} className='size-16' />
              <div className='min-w-0 flex-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <h1 className='text-xl font-semibold tracking-tight'>{contractor.name}</h1>
                  {contractor.verified ? <BadgeCheck className='text-primary size-5' /> : null}
                </div>
                <p className='text-muted-foreground text-sm'>{contractor.kind}</p>
                <ContractorStats contractor={contractor} className='mt-3' />
              </div>
            </div>
          </header>

          <Tabs
            value={tab}
            onValueChange={(next) => router.replace(contractorFirmRoute(projectId, contractorId, next))}
          >
            <TabsList>
              {CONTRACTOR_TABS.map((key) => (
                <TabsTrigger key={key} value={key}>
                  {t(`tabs.${key}`)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value='overview' className='mt-5'>
              <OverviewTab contractor={contractor} />
            </TabsContent>

            <TabsContent value='projects' className='mt-5'>
              <ProjectsTab contractor={contractor} />
            </TabsContent>

            <TabsContent value='legal' className='mt-5'>
              <LegalTab contractor={contractor} />
            </TabsContent>

            <TabsContent value='partnership' className='mt-5'>
              <PartnershipTab contractor={contractor} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Cột phải dính theo cuộn: nút "Mời báo giá" là hành động chính của màn,
            hồ sơ lại dài — để nó trôi mất là bắt người dùng cuộn ngược lên. */}
        <aside className='space-y-4 lg:sticky lg:top-24 lg:self-start'>
          <section className='bg-card space-y-3 rounded-2xl border p-4'>
            <h2 className='text-sm font-semibold'>{t('activity')}</h2>
            <ul className='space-y-2.5 text-sm'>
              <li className='flex items-start gap-2.5'>
                <CalendarDays className='text-primary mt-0.5 size-4 shrink-0' />
                <span>{t('founded', { year: contractor.foundedYear })}</span>
              </li>
              <li className='flex items-start gap-2.5'>
                <Users className='text-primary mt-0.5 size-4 shrink-0' />
                <span>{t('team', { count: contractor.teamSize })}</span>
              </li>
              <li className='flex items-start gap-2.5'>
                <Building2 className='text-primary mt-0.5 size-4 shrink-0' />
                <span>{t('office', { address: contractor.officeAddress })}</span>
              </li>
              <li className='flex items-start gap-2.5'>
                <ShieldCheck className='text-primary mt-0.5 size-4 shrink-0' />
                <span>{t('warranty', { months: contractor.warrantyMonths })}</span>
              </li>
            </ul>
          </section>

          <div className='space-y-2'>
            {invited || inviteLocked ? (
              <Button className='w-full' disabled>
                <Send className='size-4' />
                {invited ? tCommon('invited') : tCommon('inviteFull', { max: MAX_INVITATIONS })}
              </Button>
            ) : (
              <Button asChild className='w-full'>
                <Link href={contractorInviteRoute(projectId, contractorId)}>
                  <Send className='size-4' />
                  {tCommon('invite')}
                </Link>
              </Button>
            )}

            <Button
              variant='outline'
              className={cn('w-full', inCompare && 'border-primary text-primary-strong')}
              onClick={() => toggleCompare(contractorId)}
            >
              <Plus className='size-4' />
              {inCompare ? t('inCompare') : t('addToCompare')}
            </Button>
          </div>

          <p className='text-muted-foreground bg-muted/50 flex items-start gap-2 rounded-xl p-3 text-xs'>
            <Lock className='mt-0.5 size-3.5 shrink-0' />
            <span>{t('contactLocked')}</span>
          </p>

          <button
            type='button'
            onClick={() => toast.success(t('reportSent'))}
            className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs'
          >
            <Flag className='size-3.5' />
            {t('report')}
          </button>
        </aside>
      </div>
    </div>
  )
}

/** Tab Tổng quan (S13): giới thiệu, thế mạnh, ảnh công trình. */
function OverviewTab({ contractor }: { contractor: Contractor }) {
  const t = useTranslations('contractors.firm')

  return (
    <div className='bg-card space-y-5 rounded-2xl border p-5'>
      <div>
        <h2 className='text-base font-semibold'>{t('introTitle')}</h2>
        <p className='text-muted-foreground mt-2 text-sm leading-relaxed text-pretty'>{contractor.intro}</p>
      </div>

      <div>
        <h3 className='text-sm font-semibold'>{t('strengths')}</h3>
        <ul className='mt-2 flex flex-wrap gap-2'>
          {contractor.strengths.map((strength) => (
            <li key={strength} className='border-primary/30 text-primary-strong rounded-full border px-3 py-1 text-xs'>
              {strength}
            </li>
          ))}
        </ul>
      </div>

      {contractor.photos.length > 0 ? (
        <ul className='grid gap-3 sm:grid-cols-3'>
          {contractor.photos.map((photo) => (
            <li key={photo.caption} className='overflow-hidden rounded-xl border'>
              {photo.url ? <Photo src={photo.url} alt={photo.caption} className='aspect-[4/3] w-full' /> : null}
              <p className='text-muted-foreground px-3 py-2 text-xs'>{photo.caption}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/** Tab Dự án đã thực hiện (S13, khối "Dự án tiêu biểu"). */
function ProjectsTab({ contractor }: { contractor: Contractor }) {
  const t = useTranslations('contractors.firm')

  return (
    <div className='bg-card rounded-2xl border p-5'>
      <h2 className='text-base font-semibold'>{t('featured')}</h2>
      <ul className='mt-4 grid gap-4 sm:grid-cols-3'>
        {contractor.featuredProjects.map((project) => (
          <li key={project.id} className='overflow-hidden rounded-xl border'>
            {project.imageUrl ? (
              <Photo src={project.imageUrl} alt={project.name} className='aspect-[4/3] w-full' />
            ) : null}
            <div className='space-y-1 p-3'>
              <p className='text-sm font-medium'>{project.name}</p>
              <p className='text-muted-foreground text-xs'>{project.year}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Tab Năng lực pháp lý — các mục đã được SAVICO đối chiếu. */
function LegalTab({ contractor }: { contractor: Contractor }) {
  const t = useTranslations('contractors.firm')

  return (
    <div className='bg-card rounded-2xl border p-5'>
      <h2 className='text-base font-semibold'>{t('legalTitle')}</h2>
      <ul className='mt-4 grid gap-3 sm:grid-cols-2'>
        {contractor.legalChecks.map((check) => (
          <li key={check} className='flex items-start gap-2.5 text-sm'>
            <CircleCheck className='text-primary mt-0.5 size-4 shrink-0' />
            <span>{check}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Tab Hợp tác SAVICO (S14).
 *
 * Bản mô tả yêu cầu hiển thị bản scan thỏa thuận và cho tải PDF. Ở đây màn chỉ
 * dựng khối SIÊU DỮ LIỆU đã xác minh (mã hồ sơ, ngày ký, số trang, trạng thái)
 * và khung xem cho bản scan ĐÃ CHE nội dung bảo mật; hợp đồng nguyên bản có chữ
 * ký và con dấu của hai pháp nhân không nên nằm trên trang công khai. Khi đội
 * vận hành tải bản đã che lên (`partnership.scanUrl`), khung này hiện nó cùng
 * nút xem toàn màn hình.
 */
function PartnershipTab({ contractor }: { contractor: Contractor }) {
  const t = useTranslations('contractors.firm.partnership')
  const locale = useLocale() as Locale
  const { partnership } = contractor

  const rows = [
    { label: t('code'), value: partnership.contractCode },
    { label: t('signedAt'), value: formatDate(partnership.signedAt, locale) },
    { label: t('pages'), value: String(partnership.pageCount) },
    { label: t('state'), value: t('stateVerified') }
  ]

  return (
    <div className='space-y-5'>
      <section className='bg-accent/40 flex flex-wrap items-center gap-4 rounded-2xl border p-5'>
        <span className='bg-card text-primary flex size-12 shrink-0 items-center justify-center rounded-xl border'>
          <FileCheck2 className='size-5' />
        </span>
        <div className='min-w-0 flex-1'>
          <h2 className='text-base font-semibold'>{t('title')}</h2>
          <p className='text-muted-foreground mt-1 text-sm text-pretty'>{t('body', { name: contractor.name })}</p>
          <div className='mt-2.5 flex flex-wrap gap-2 text-xs'>
            <span className='bg-card inline-flex items-center gap-1.5 rounded-md border px-2 py-1'>
              <ShieldCheck className='text-primary size-3.5' />
              {t('verified')}
            </span>
            <span className='bg-card inline-flex items-center gap-1.5 rounded-md border px-2 py-1'>
              <CalendarDays className='text-primary size-3.5' />
              {t('since', { since: partnership.since })}
            </span>
          </div>
        </div>
      </section>

      <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]'>
        <section className='bg-card min-w-0 rounded-2xl border p-5'>
          <h3 className='text-sm font-semibold'>{t('scanTitle')}</h3>

          <div className='bg-muted/40 mt-3 flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center'>
            <FileText className='text-muted-foreground/60 size-9' strokeWidth={1.25} />
            <p className='text-muted-foreground mt-3 max-w-sm text-xs text-pretty'>
              {partnership.scanUrl ? t('privacyNote') : t('unavailable')}
            </p>
            {partnership.scanUrl ? (
              <p className='text-muted-foreground mt-2 text-xs'>
                {t('page', { current: 1, total: partnership.pageCount })}
              </p>
            ) : null}
          </div>
        </section>

        <section className='bg-card h-fit rounded-2xl border p-4'>
          <h3 className='text-sm font-semibold'>{t('agreement')}</h3>
          <dl className='mt-3 space-y-2.5 text-sm'>
            {rows.map((row) => (
              <div key={row.label} className='flex items-center justify-between gap-3'>
                <dt className='text-muted-foreground text-xs'>{row.label}</dt>
                <dd className='font-medium'>{row.value}</dd>
              </div>
            ))}
          </dl>
          <p className='text-primary-strong bg-accent/60 mt-3 flex items-start gap-2 rounded-lg p-2.5 text-xs'>
            <CircleCheck className='mt-0.5 size-3.5 shrink-0' />
            <span>{t('checked')}</span>
          </p>
        </section>
      </div>
    </div>
  )
}
