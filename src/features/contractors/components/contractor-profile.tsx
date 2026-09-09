'use client'

import {
  BadgeCheck,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  CircleCheck,
  Clock,
  Download,
  FileCheck2,
  FileText,
  Handshake,
  ImageIcon,
  Lock,
  Map as MapIcon,
  MapPin,
  Maximize2,
  Minus,
  Plus,
  Search,
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
import {
  CONTRACTOR_PREVIEW_ID,
  contractorFirmRoute,
  contractorInviteRoute,
  contractorMatchesRoute
} from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { formatDate, formatNumber } from '@/shared/utils'
import { CONTRACTOR_TABS, MAX_INVITATIONS, type ContractorTab } from '../constants/contractors.constants'
import { useBrief } from '../hooks/use-brief'
import { useContractor } from '../hooks/use-contractors'
import { useInvitations } from '../hooks/use-invitations'
import { isInvited, remainingInvites } from '../services/contractor-list.service'
import { useContractorsStore } from '../store/contractors.store'
import type { Contractor, ContractorPhoto } from '../types/contractor.types'
import { ContractorLogo } from './contractor-logo'
import { useProjectPickerStore } from '../store/project-picker.store'
import { ProjectContextBar } from './project-context-bar'
import { ProjectPickerDialog } from './project-picker-dialog'

interface ContractorProfileProps {
  projectId: string
  contractorId: string
  /** Tab đang mở, lấy từ `?tab=` để chia sẻ được đường dẫn tới đúng tab. */
  tab: ContractorTab
}

/** Bề ngang trang, đo từ ảnh S13: khối nội dung chiếm 90% bề ngang màn. */
const PAGE_CONTAINER = 'mx-auto w-[90%] max-w-[80rem]'

/**
 * Hồ sơ một nhà thầu — S13 (tab Tổng quan) và S14 (tab Hợp tác SAVICO) là HAI
 * TAB CỦA CÙNG MỘT MÀN, không phải hai trang.
 *
 * Ba điểm bố cục lấy thẳng từ ảnh S13, đừng "dọn dẹp" lại:
 * - Khối nhận diện, dải chỉ số và HÀNG TAB nằm chung MỘT thẻ. Tab tách ra ngoài
 *   thẻ (bản trước) làm phần đầu trang vỡ thành hai mảnh rời.
 * - Tab Tổng quan là bản TÓM TẮT cả hồ sơ (giới thiệu, hợp tác, dự án tiêu
 *   biểu, năng lực); ba tab còn lại là bản chi tiết của từng phần. Ảnh mẫu vẽ
 *   đúng như vậy — khách xem lướt một lượt rồi mới bấm vào tab cần soi kỹ.
 * - Cột phải chỉ có ba dòng TÌNH TRẠNG NHẬN VIỆC (khảo sát / đang nhận / phạm
 *   vi). Năm thành lập, quy mô đội ngũ và văn phòng chuyển sang cột trái, nằm
 *   ngay dưới đoạn giới thiệu.
 */
export function ContractorProfile({ projectId, contractorId, tab }: ContractorProfileProps) {
  const t = useTranslations('contractors.firm')
  const tCommon = useTranslations('contractors.common')
  const locale = useLocale() as Locale
  const router = useRouter()

  const openPicker = useProjectPickerStore((s) => s.openPicker)
  /** Xem thử — chưa gắn hồ sơ dự án nào (xem `CONTRACTOR_PREVIEW_ID`). */
  const preview = projectId === CONTRACTOR_PREVIEW_ID

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
      <div className={cn(PAGE_CONTAINER, 'space-y-6 py-8')}>
        <Skeleton className='h-20 rounded-2xl' />
        <Skeleton className='h-96 rounded-2xl' />
      </div>
    )
  }

  const areas = contractor.serviceAreas.slice(0, 3).join(', ')

  /** Dải chỉ số trong thẻ nhận diện — giá trị ở trên, chú thích nhỏ ở dưới. */
  const headerFacts = [
    {
      key: 'similar',
      icon: CalendarCheck,
      value: tCommon('similarShort', { count: contractor.similarProjects }),
      hint: tCommon('similarSuffix')
    },
    {
      key: 'distance',
      icon: MapPin,
      value: tCommon('distanceShort', {
        km: formatNumber(contractor.distanceKm, locale, { minimumFractionDigits: 1 })
      }),
      hint: tCommon('distanceSuffix')
    },
    { key: 'areas', icon: MapIcon, value: tCommon('serviceAreas'), hint: areas },
    {
      key: 'survey',
      icon: Clock,
      value: tCommon('surveyLabel'),
      hint: tCommon('surveyHours', { hours: contractor.surveyWithinHours })
    }
  ]

  /** Ba dòng "Thông tin hoạt động" ở cột phải — nhãn nhỏ ở trên, giá trị ở dưới. */
  const activityRows = [
    {
      key: 'survey',
      icon: Clock,
      label: tCommon('surveyLabel'),
      value: tCommon('surveyHours', { hours: contractor.surveyWithinHours })
    },
    {
      key: 'accepting',
      icon: Briefcase,
      label: contractor.acceptingProjects ? tCommon('acceptingLabel') : tCommon('notAccepting'),
      value: tCommon('acceptingSuffix')
    },
    { key: 'areas', icon: MapIcon, label: tCommon('serviceAreas'), value: areas }
  ]

  return (
    <div className={cn(PAGE_CONTAINER, 'space-y-4 py-8')}>
      {/* Xem thử thì chưa có hồ sơ để hiện — để nguyên thanh này là một khung
          chờ xám đứng mãi ở đầu trang. */}
      {preview ? null : <ProjectContextBar brief={brief} compact />}

      <Link
        href={contractorMatchesRoute(projectId)}
        className='text-primary-strong inline-flex items-center gap-2 text-sm font-medium'
      >
        ← {tCommon('backToList')}
      </Link>

      <div className='grid gap-x-[1.4%] gap-y-5 lg:grid-cols-[79%_minmax(0,1fr)]'>
        <div className='min-w-0'>
          <Tabs
            value={tab}
            onValueChange={(next) => router.replace(contractorFirmRoute(projectId, contractorId, next))}
            className='gap-5'
          >
            {/* Nhận diện + chỉ số + tab: một thẻ duy nhất, đúng ảnh S13. */}
            <div className='bg-card rounded-2xl border'>
              <div className='flex flex-wrap items-center gap-y-4 px-5 py-4'>
                <ContractorLogo contractor={contractor} className='size-24 shrink-0 rounded-xl' />

                <div className='min-w-0 grow basis-52 px-4 lg:grow-0 lg:basis-[25%]'>
                  <div className='flex items-center gap-2'>
                    <h1 className='min-w-0 text-xl font-semibold tracking-tight text-balance'>{contractor.name}</h1>
                    {contractor.verified ? <BadgeCheck className='text-primary size-5 shrink-0' /> : null}
                  </div>
                  <p className='text-muted-foreground mt-1 text-sm'>{contractor.kind}</p>
                </div>

                <div className='divide-border border-border flex min-w-0 grow basis-full divide-x border-l lg:basis-0'>
                  {headerFacts.map((fact) => (
                    <div key={fact.key} className='min-w-0 flex-1 px-2.5'>
                      <p className='flex min-w-0 items-center gap-1.5 text-sm font-semibold'>
                        <fact.icon aria-hidden className='text-primary size-4 shrink-0' />
                        <span className='truncate'>{fact.value}</span>
                      </p>
                      <p className='text-muted-foreground mt-1 truncate pl-5.5 text-xs'>{fact.hint}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tab gạch chân, không phải viên thuốc nền xám của primitive. */}
              <TabsList className='h-auto w-full justify-start gap-8 overflow-x-auto rounded-none border-t bg-transparent px-5 py-0'>
                {CONTRACTOR_TABS.map((key) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className='data-[state=active]:border-primary data-[state=active]:text-primary-strong text-muted-foreground h-auto flex-none rounded-none border-x-0 border-t-0 border-b-2 border-transparent px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none'
                  >
                    {t(`tabs.${key}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value='overview' className='space-y-5'>
              <IntroCard contractor={contractor} />
              <PartnershipSummary contractor={contractor} />
              <FeaturedProjects contractor={contractor} projectId={projectId} />
              <LegalChecks contractor={contractor} />
            </TabsContent>

            <TabsContent value='projects'>
              <FeaturedProjects contractor={contractor} projectId={projectId} />
            </TabsContent>

            <TabsContent value='legal'>
              <LegalChecks contractor={contractor} />
            </TabsContent>

            <TabsContent value='partnership'>
              <PartnershipTab contractor={contractor} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Cột phải dính theo cuộn: nút "Mời báo giá" là hành động chính của màn,
            hồ sơ lại dài — để nó trôi mất là bắt người dùng cuộn ngược lên. */}
        <aside className='space-y-4 lg:sticky lg:top-24 lg:self-start'>
          <section className='bg-card rounded-2xl border p-4'>
            <h2 className='text-base font-semibold'>{t('activity')}</h2>
            <ul className='mt-3 space-y-2'>
              {activityRows.map((row) => (
                <li key={row.key} className='flex items-center gap-3 rounded-xl border px-3 py-2.5'>
                  <row.icon aria-hidden className='text-primary size-4 shrink-0' />
                  <div className='min-w-0'>
                    <p className='text-muted-foreground text-[11px] leading-tight'>{row.label}</p>
                    <p className='mt-0.5 truncate text-sm font-semibold'>{row.value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className='space-y-2.5'>
            {preview ? (
              // Mời phải gắn vào một dự án (R1 đếm lời mời theo dự án), nên ở
              // chế độ xem thử nút này mở hộp thoại chọn dự án thay vì khóa
              // cứng — khách vẫn đi tiếp được, chỉ là qua một bước.
              <Button className='h-11 w-full' onClick={openPicker}>
                <Send className='size-4' />
                {tCommon('invite')}
              </Button>
            ) : invited || inviteLocked ? (
              <Button className='h-11 w-full' disabled>
                <Send className='size-4' />
                {invited ? tCommon('invited') : tCommon('inviteFull', { max: MAX_INVITATIONS })}
              </Button>
            ) : (
              <Button asChild className='h-11 w-full'>
                <Link href={contractorInviteRoute(projectId, contractorId)}>
                  <Send className='size-4' />
                  {tCommon('invite')}
                </Link>
              </Button>
            )}

            <Button
              variant='outline'
              className={cn('border-primary/50 text-primary-strong h-11 w-full', inCompare && 'border-primary')}
              onClick={() => toggleCompare(contractorId)}
            >
              <Plus className='size-4' />
              {inCompare ? t('inCompare') : t('addToCompare')}
            </Button>
          </div>

          <p className='text-muted-foreground bg-muted/50 flex items-start gap-2 rounded-xl p-3 text-xs leading-relaxed'>
            <Lock className='mt-0.5 size-3.5 shrink-0' />
            <span>{t('contactLocked')}</span>
          </p>

          <button
            type='button'
            onClick={() => toast.success(t('reportSent'))}
            className='text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs'
          >
            <FileText className='size-3.5' />
            {t('report')}
          </button>
        </aside>
      </div>
      <ProjectPickerDialog />
    </div>
  )
}

/**
 * Khối giới thiệu: chữ bên trái, bộ ảnh ghép bên phải.
 *
 * Ảnh ghép là 1 ảnh lớn + 2 ảnh xếp chồng, mỗi ảnh có chú thích đè lên đáy —
 * đúng ảnh S13. Tỉ lệ 58,6% / 41,4% cũng đo từ ảnh đó.
 */
function IntroCard({ contractor }: { contractor: Contractor }) {
  const t = useTranslations('contractors.firm')

  const facts = [
    { key: 'founded', icon: CalendarDays, text: t('founded', { year: contractor.foundedYear }) },
    { key: 'team', icon: Users, text: t('team', { count: contractor.teamSize }) },
    { key: 'office', icon: MapPin, text: t('office', { address: contractor.officeAddress }) }
  ]

  const [lead, ...rest] = contractor.photos

  return (
    <section className='bg-card grid gap-x-[1.5%] gap-y-5 rounded-2xl border p-4 lg:grid-cols-[37%_minmax(0,1fr)]'>
      <div className='min-w-0'>
        <h2 className='text-base font-semibold'>{t('introTitle')}</h2>
        <p className='text-muted-foreground mt-2 text-sm leading-relaxed text-pretty'>{contractor.intro}</p>

        <ul className='mt-4 space-y-2.5 text-sm'>
          {facts.map((fact) => (
            <li key={fact.key} className='flex items-start gap-2.5'>
              <fact.icon aria-hidden className='text-primary mt-0.5 size-4 shrink-0' />
              <span className='text-pretty'>{fact.text}</span>
            </li>
          ))}
        </ul>

        <ul className='mt-4 flex flex-wrap gap-2'>
          {contractor.strengths.map((strength) => (
            <li key={strength} className='border-primary/40 text-primary-strong rounded-md border px-2.5 py-1 text-xs'>
              {strength}
            </li>
          ))}
        </ul>
      </div>

      {/* Ô lớn KHÔNG khóa tỉ lệ: trong ảnh mẫu bộ ảnh cao đúng bằng khối chữ bên
          trái, hai đáy thẳng hàng. Đặt `aspect-*` cho ô lớn thì nó dừng sớm hơn
          cột ảnh nhỏ bên cạnh, bộ ghép thành hình răng cưa. */}
      {lead ? (
        <div className='grid min-h-52 min-w-0 gap-[1.8%] sm:grid-cols-[58.6%_minmax(0,1fr)]'>
          <CollagePhoto photo={lead} />
          <div className='flex flex-col gap-2'>
            {rest.slice(0, 2).map((photo) => (
              <CollagePhoto key={photo.caption} photo={photo} className='min-h-24 flex-1' />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

/**
 * Một ô ảnh trong bộ ghép.
 *
 * CHỖ CHỜ ASSET: chưa có ảnh thật của nhà thầu thì để KHUNG NÉT ĐỨT kèm chú
 * thích, giống ô logo. Nhét đại ảnh kho vào đây thì "Trụ sở công ty" hóa ra
 * biệt thự có hồ bơi, "Đội ngũ nhân sự" hóa ra một người thợ điện — trông như
 * đã có ảnh nên không ai biết là còn thiếu.
 */
function CollagePhoto({ photo, className }: { photo: ContractorPhoto; className?: string }) {
  if (!photo.url) {
    return (
      <div
        className={cn(
          'bg-muted/30 text-muted-foreground/70 flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed p-2 text-center',
          className
        )}
      >
        <ImageIcon aria-hidden className='size-5 shrink-0' />
        <p className='text-xs'>{photo.caption}</p>
      </div>
    )
  }

  return (
    <div className={cn('relative min-w-0 overflow-hidden rounded-xl border', className)}>
      {/* `alt` để trống: chú thích ngay bên dưới đã mô tả ảnh, đặt cả hai thì
          trình đọc màn hình đọc trùng hai lần. */}
      <Photo src={photo.url} alt='' className='size-full' sizes='(max-width: 768px) 100vw, 360px' />
      <p className='absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent px-3 pt-6 pb-2 text-xs font-medium text-white'>
        {photo.caption}
      </p>
    </div>
  )
}

/**
 * Dải "Đối tác hợp tác cùng SAVICO" — bản tóm tắt dùng ở tab Tổng quan (S13) và
 * mở đầu tab Hợp tác SAVICO (S14). Một khối, hai chỗ dùng, khỏi lệch nội dung.
 */
function PartnershipSummary({ contractor }: { contractor: Contractor }) {
  const t = useTranslations('contractors.firm.partnership')
  const { partnership } = contractor

  return (
    <section className='bg-card flex flex-wrap items-center gap-4 rounded-2xl border p-4'>
      <span className='bg-primary/10 text-primary flex size-14 shrink-0 items-center justify-center rounded-full'>
        <Handshake className='size-6' />
      </span>
      <div className='min-w-0 flex-1'>
        <h2 className='text-base font-semibold'>{t('title')}</h2>
        <p className='text-muted-foreground mt-1 text-sm text-pretty'>{t('body', { name: contractor.name })}</p>
        <div className='mt-2.5 flex flex-wrap gap-2 text-xs'>
          <span className='bg-primary/10 text-primary-strong inline-flex items-center gap-1.5 rounded-md px-2.5 py-1'>
            <ShieldCheck className='size-3.5' />
            {t('verified')}
          </span>
          <span className='bg-primary/10 text-primary-strong inline-flex items-center gap-1.5 rounded-md px-2.5 py-1'>
            <CalendarDays className='size-3.5' />
            {t('since', { since: partnership.since })}
          </span>
        </div>
      </div>
    </section>
  )
}

/** Khối "Dự án tiêu biểu": ảnh bên trái, tên + năm + liên kết bên phải. */
function FeaturedProjects({ contractor, projectId }: { contractor: Contractor; projectId: string }) {
  const t = useTranslations('contractors.firm')

  return (
    <section className='bg-card rounded-2xl border p-4'>
      <h2 className='text-base font-semibold'>{t('featured')}</h2>
      <ul className='mt-3 grid gap-x-[3%] gap-y-4 sm:grid-cols-3'>
        {contractor.featuredProjects.map((project) => (
          <li key={project.id} className='flex min-w-0 gap-3'>
            {project.imageUrl ? (
              <Photo
                src={project.imageUrl}
                alt={project.name}
                className='aspect-video w-1/2 shrink-0 rounded-lg'
                sizes='(max-width: 768px) 40vw, 160px'
              />
            ) : (
              <div className='bg-muted/30 flex aspect-video w-1/2 shrink-0 items-center justify-center rounded-lg border border-dashed'>
                <ImageIcon className='text-muted-foreground/50 size-5' />
              </div>
            )}
            <div className='min-w-0'>
              <p className='text-sm leading-snug font-medium text-pretty'>{project.name}</p>
              <p className='text-muted-foreground mt-1 text-xs'>{project.year}</p>
              <Link
                href={contractorFirmRoute(projectId, contractor.id, 'projects')}
                className='text-primary-strong mt-2 inline-flex items-center gap-1.5 text-xs font-medium'
              >
                {t('viewProject')} →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Khối "Năng lực & xác minh" — bốn mục đã được SAVICO đối chiếu. */
function LegalChecks({ contractor }: { contractor: Contractor }) {
  const t = useTranslations('contractors.firm')

  return (
    <section className='bg-card rounded-2xl border p-4'>
      <h2 className='text-base font-semibold'>{t('legalTitle')}</h2>
      <ul className='mt-3 grid gap-x-[3%] gap-y-3 sm:grid-cols-2 lg:grid-cols-4'>
        {contractor.legalChecks.map((check) => (
          <li key={check} className='flex items-start gap-2.5 text-sm'>
            <CircleCheck className='text-primary mt-0.5 size-4 shrink-0' />
            <span className='text-muted-foreground text-pretty'>{check}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Tab Hợp tác SAVICO (S14).
 *
 * Hình S14 vẽ một khung xem tài liệu đầy đủ: dải thumbnail từng trang bên
 * trái, khung trang ở giữa với thanh công cụ (số trang, thu/phóng, toàn màn
 * hình) ở đáy, cột siêu dữ liệu bên phải. Tỉ lệ ba cột 10,3% / 57,8% / 27,9%
 * đo từ ảnh đó.
 *
 * CHỖ CHỜ ASSET: bản scan thật do đội vận hành tải lên (`partnership.scanUrl`).
 * Chưa có thì khung xem và dải thumbnail để NÉT ĐỨT, thanh công cụ và hai nút
 * thao tác khóa lại — dựng khung sẵn để khi có tệp là hiện, chứ không vẽ một
 * trang hợp đồng giả cho đẹp ảnh chụp màn hình.
 *
 * Lưu ý nội dung: hợp đồng nguyên bản có chữ ký và con dấu của hai pháp nhân,
 * nên thứ hiển thị ở đây phải là bản ĐÃ CHE các nội dung bảo mật.
 */
function PartnershipTab({ contractor }: { contractor: Contractor }) {
  const t = useTranslations('contractors.firm.partnership')
  const locale = useLocale() as Locale
  const { partnership } = contractor

  const hasScan = Boolean(partnership.scanUrl)
  const pages = Array.from({ length: partnership.pageCount }, (_, index) => index + 1)

  const rows = [
    { key: 'code', icon: FileText, label: t('code'), value: partnership.contractCode },
    {
      key: 'signedAt',
      icon: CalendarDays,
      label: t('signedAt'),
      value: formatDate(partnership.signedAt, locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
    },
    { key: 'pages', icon: FileText, label: t('pages'), value: String(partnership.pageCount) },
    { key: 'state', icon: CircleCheck, label: t('state'), value: t('stateVerified'), highlight: true }
  ]

  return (
    <div className='space-y-5'>
      <PartnershipSummary contractor={contractor} />

      <section className='bg-card rounded-2xl border p-4'>
        <h3 className='text-base font-semibold'>{t('scanTitle')}</h3>

        <div className='mt-3 grid gap-x-[2%] gap-y-4 lg:grid-cols-[10.3%_57.8%_minmax(0,1fr)]'>
          {/* Dải thumbnail: ô trang bên trái, số trang bên phải. */}
          <ol className='bg-muted/40 flex gap-2 overflow-x-auto rounded-xl p-2 lg:flex-col lg:self-start lg:overflow-x-visible'>
            {pages.map((page) => (
              <li key={page} className='flex shrink-0 items-center gap-2 lg:shrink'>
                <button
                  type='button'
                  disabled={!hasScan}
                  aria-label={t('goToPage', { page })}
                  className={cn(
                    'bg-card aspect-3/4 w-12 rounded-md border lg:w-[57%]',
                    page === 1 ? 'border-primary' : 'border-dashed',
                    hasScan ? 'hover:border-primary' : 'cursor-default'
                  )}
                />
                <span className='text-muted-foreground text-xs'>{page}</span>
              </li>
            ))}
          </ol>

          {/* Khung xem: vùng trang + thanh công cụ dưới đáy. */}
          <div className='bg-muted/40 flex aspect-315/268 min-h-64 flex-col overflow-hidden rounded-xl'>
            <div className='flex min-h-0 flex-1 items-center justify-center p-4'>
              <div className='bg-card flex aspect-3/4 h-full max-w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-center'>
                <FileCheck2 className='text-muted-foreground/60 size-9' strokeWidth={1.25} />
                <p className='text-muted-foreground max-w-xs text-xs text-pretty'>
                  {hasScan ? t('privacyNote') : t('unavailable')}
                </p>
              </div>
            </div>

            <div className='text-muted-foreground flex items-center justify-between gap-3 border-t px-3 py-2 text-xs'>
              <span>{t('page', { current: 1, total: partnership.pageCount })}</span>
              <div className='flex items-center gap-1'>
                <ViewerControl icon={Minus} label={t('zoomOut')} disabled={!hasScan} />
                <ViewerControl icon={Search} label={t('zoomFit')} disabled={!hasScan} />
                <ViewerControl icon={Plus} label={t('zoomIn')} disabled={!hasScan} />
                <ViewerControl icon={Maximize2} label={t('fullscreen')} disabled={!hasScan} />
              </div>
            </div>
          </div>

          {/* Cột siêu dữ liệu đã xác minh. */}
          <div className='min-w-0'>
            <p className='text-muted-foreground text-sm'>{t('agreement')}</p>
            <p className='mt-1 text-base font-semibold text-pretty'>{t('parties', { name: contractor.name })}</p>

            <dl className='mt-4 space-y-3 text-sm'>
              {rows.map((row) => (
                <div key={row.key} className='flex items-center gap-3'>
                  <dt className='text-muted-foreground flex min-w-0 flex-1 items-center gap-2'>
                    <row.icon
                      aria-hidden
                      className={cn('size-4 shrink-0', row.highlight ? 'text-primary' : 'text-muted-foreground')}
                    />
                    <span className='truncate'>{row.label}</span>
                  </dt>
                  <dd className={cn('shrink-0 font-medium', row.highlight && 'text-primary-strong')}>{row.value}</dd>
                </div>
              ))}
            </dl>

            <p className='text-primary-strong bg-primary/10 mt-4 flex items-start gap-2 rounded-xl p-3 text-xs leading-relaxed'>
              <CircleCheck className='mt-0.5 size-4 shrink-0' />
              <span>{t('checked')}</span>
            </p>

            <div className='mt-4 space-y-2.5'>
              <Button className='h-11 w-full' disabled={!hasScan}>
                <Maximize2 className='size-4' />
                {t('fullscreen')}
              </Button>
              <Button
                variant='outline'
                className='border-primary/50 text-primary-strong h-11 w-full'
                disabled={!hasScan}
              >
                <Download className='size-4' />
                {t('download')}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/** Một nút nhỏ trên thanh công cụ của khung xem. */
function ViewerControl({ icon: Icon, label, disabled }: { icon: typeof Plus; label: string; disabled: boolean }) {
  return (
    <button
      type='button'
      disabled={disabled}
      aria-label={label}
      title={label}
      className='hover:bg-card flex size-7 items-center justify-center rounded-md disabled:pointer-events-none disabled:opacity-50'
    >
      <Icon className='size-3.5' />
    </button>
  )
}
