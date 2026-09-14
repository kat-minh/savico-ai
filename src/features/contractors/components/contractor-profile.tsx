'use client'

import {
  BadgeCheck,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Handshake,
  ImageIcon,
  Loader2,
  Lock,
  Map as MapIcon,
  MapPin,
  Maximize2,
  Minus,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Users,
  X
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Link, useRouter } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { Photo, revealContainerVariants, revealEase, revealItemVariants, RevealPhoto } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/shared/components/ui/dialog'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import {
  CONTRACTOR_PREVIEW_ID,
  contractorFirmRoute,
  contractorInvitationsRoute,
  contractorInviteRoute,
  contractorMatchesRoute
} from '@/shared/constants/routes'
import { usePastElement } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'
import { formatDate, formatNumber } from '@/shared/utils'
import { CONTRACTOR_TABS, MAX_INVITATIONS, type ContractorTab } from '../constants/contractors.constants'
import { useBrief } from '../hooks/use-brief'
import { useContractor } from '../hooks/use-contractors'
import { useInvitations } from '../hooks/use-invitations'
import { isInvited, remainingInvites } from '../services/contractor-list.service'
import { useContractorsStore } from '../store/contractors.store'
import type { Contractor, ContractorPhoto } from '../types/contractor.types'
import { MATCHES_LAST_VIEWED_KEY } from './contractor-matches'
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
 * Nội dung tab trượt vào theo hướng tab vừa chọn (mục 4) — Radix dựng lại mỗi
 * `TabsContent` khi nó vừa active nên `initial`/`animate` chạy đúng một lần
 * mỗi lần đổi tab, không cần `AnimatePresence`.
 */
function TabPanel({ direction, children }: { direction: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: direction * 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: revealEase }}
      className='space-y-5'
    >
      {children}
    </motion.div>
  )
}

/** Neo cho `usePastElement` — cuộn qua khối nhận diện thì dải tóm tắt dính dưới thanh điều hướng (mục 3). */
const HEADER_ANCHOR_ID = 'firm-header-anchor'

/**
 * Nút "Mời báo giá" — MỘT nơi quyết định trạng thái, dùng lại cho cột phải,
 * dải tóm tắt dính khi cuộn và thanh dưới cùng trên mobile (mục 3/11), để ba
 * chỗ không bao giờ lệch nhau.
 */
function InviteButton({
  projectId,
  contractorId,
  contractor,
  preview,
  invited,
  inviteLocked,
  navigating,
  onNavigate,
  onOpenPicker,
  size
}: {
  projectId: string
  contractorId: string
  contractor: Contractor
  preview: boolean
  invited: boolean
  inviteLocked: boolean
  navigating: boolean
  onNavigate: () => void
  onOpenPicker: () => void
  size?: 'sm'
}) {
  const t = useTranslations('contractors.firm')
  const tCommon = useTranslations('contractors.common')

  if (!contractor.acceptingProjects) {
    return (
      <Button size={size} className='w-full opacity-50' disabled>
        <Send className='size-4' />
        {tCommon('invite')}
      </Button>
    )
  }

  if (preview) {
    return (
      <Button size={size} className='w-full' onClick={onOpenPicker}>
        <Send className='size-4' />
        {tCommon('invite')}
      </Button>
    )
  }

  if (invited) {
    return (
      <Button asChild size={size} variant='outline' className='border-primary text-primary-strong w-full'>
        <Link href={contractorInvitationsRoute(projectId)}>
          <Send className='size-4' />
          {tCommon('invited')} · {t('viewInvites')}
        </Link>
      </Button>
    )
  }

  if (inviteLocked) {
    return (
      <Button size={size} className='w-full' disabled title={tCommon('inviteFull', { max: MAX_INVITATIONS })}>
        <Send className='size-4' />
        {tCommon('inviteFull', { max: MAX_INVITATIONS })}
      </Button>
    )
  }

  return (
    <Button asChild size={size} className='w-full' onClick={onNavigate}>
      <Link href={contractorInviteRoute(projectId, contractorId)}>
        {navigating ? <Loader2 className='size-4 animate-spin' /> : <Send className='size-4' />}
        {tCommon('invite')}
      </Link>
    </Button>
  )
}

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
  const tGlobal = useTranslations('common')
  const locale = useLocale() as Locale
  const router = useRouter()

  const openPicker = useProjectPickerStore((s) => s.openPicker)
  /** Xem thử — chưa gắn hồ sơ dự án nào (xem `CONTRACTOR_PREVIEW_ID`). */
  const preview = projectId === CONTRACTOR_PREVIEW_ID

  /** Bấm một thẻ "thế mạnh" ở khối giới thiệu → tab "Dự án đã thực hiện" (mục 5). */
  const goToProjectsTab = () => router.replace(contractorFirmRoute(projectId, contractorId, 'projects'))

  const { data: brief } = useBrief(projectId)
  const { data: contractor, isPending } = useContractor(contractorId)
  const { data: invitations } = useInvitations(projectId)

  const compareIds = useContractorsStore((s) => s.compareIds)
  const toggleCompare = useContractorsStore((s) => s.toggleCompare)

  const sent = invitations ?? []
  const invited = isInvited(sent, contractorId)
  const inviteLocked = remainingInvites(sent) === 0
  const inCompare = compareIds.includes(contractorId)

  // Cuộn qua khối nhận diện → dải tóm tắt dính dưới thanh điều hướng (mục 3).
  const barCollapsed = usePastElement(HEADER_ANCHOR_ID)

  /** Đang xem ảnh nào trong hộp phóng — `null` là đang đóng (mục 6). */
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null)
  const [reportOpen, setReportOpen] = useState(false)

  /** Nút "Mời báo giá" thở một nhịp sau khi hiện (mục 11). */
  const [inviteBreathe, setInviteBreathe] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setInviteBreathe(true), 500)
    return () => window.clearTimeout(timer)
  }, [])
  /** Bấm "Mời báo giá" → vòng xoay trong lúc trang M08 tải (mục 11). */
  const [navigatingInvite, setNavigatingInvite] = useState(false)

  /**
   * Nội dung trượt vào theo HƯỚNG của tab vừa chọn so với tab trước đó (mục
   * 4) — dương là sang phải (tab đứng sau), âm là sang trái. Mẫu "điều chỉnh
   * state khi prop đổi" chính thức của React: so với tab đã thấy lần render
   * trước, đặt lại ngay trong thân hàm thay vì trong `useEffect`.
   */
  const [renderedTab, setRenderedTab] = useState(tab)
  const [tabDirection, setTabDirection] = useState(1)
  if (tab !== renderedTab) {
    setTabDirection(CONTRACTOR_TABS.indexOf(tab) - CONTRACTOR_TABS.indexOf(renderedTab) || 1)
    setRenderedTab(tab)
  }

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

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <Link
          href={contractorMatchesRoute(projectId)}
          onClick={() => window.sessionStorage.setItem(MATCHES_LAST_VIEWED_KEY, contractorId)}
          className='text-primary-strong inline-flex items-center gap-2 text-sm font-medium'
        >
          ← {tCommon('backToList')}
        </Link>
      </motion.div>

      <div className='grid gap-x-[1.4%] gap-y-5 lg:grid-cols-[79%_minmax(0,1fr)]'>
        <div className='min-w-0'>
          <Tabs
            value={tab}
            onValueChange={(next) => router.replace(contractorFirmRoute(projectId, contractorId, next))}
            className='gap-5'
          >
            {/* Nhận diện + chỉ số + tab: một thẻ duy nhất, đúng ảnh S13. */}
            <motion.div
              id={HEADER_ANCHOR_ID}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: revealEase }}
              className='bg-card rounded-2xl border'
            >
              <div className='flex flex-wrap items-center gap-y-4 px-5 py-4'>
                <ContractorLogo contractor={contractor} className='size-24 shrink-0 rounded-xl' />

                <div className='min-w-0 grow basis-52 px-4 lg:grow-0 lg:basis-[25%]'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h1 className='min-w-0 text-xl font-semibold tracking-tight text-balance'>{contractor.name}</h1>
                    {contractor.verified ? (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', bounce: 0.6, duration: 0.4, delay: 0.3 }}
                      >
                        <BadgeCheck className='text-primary size-5 shrink-0' />
                      </motion.span>
                    ) : null}
                    {invited ? (
                      <span className='bg-primary/10 text-primary-strong rounded-md px-2 py-0.5 text-[11px] font-medium'>
                        {tCommon('invited')}
                      </span>
                    ) : null}
                  </div>
                  <p className='text-muted-foreground mt-1 text-sm'>{contractor.kind}</p>
                </div>

                <motion.div
                  variants={revealContainerVariants}
                  initial='hidden'
                  animate='show'
                  transition={{ delayChildren: 0.4 }}
                  className='divide-border border-border flex min-w-0 grow basis-full divide-x border-l lg:basis-0'
                >
                  {headerFacts.map((fact) => (
                    <motion.div variants={revealItemVariants} key={fact.key} className='min-w-0 flex-1 px-2.5'>
                      <p className='flex min-w-0 items-center gap-1.5 text-sm font-semibold'>
                        <fact.icon aria-hidden className='text-primary size-4 shrink-0' />
                        <span className='truncate'>{fact.value}</span>
                      </p>
                      <p className='text-muted-foreground mt-1 truncate pl-5.5 text-xs'>{fact.hint}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Tab gạch chân, không phải viên thuốc nền xám của primitive.
                  Gạch chân trượt giữa các tab + vẽ từ trái khi vào trang (mục 4). */}
              <TabsList className='h-auto w-full justify-start gap-8 overflow-x-auto rounded-none border-t bg-transparent px-5 py-0'>
                {CONTRACTOR_TABS.map((key) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className='data-[state=active]:text-primary-strong text-muted-foreground relative h-auto flex-none rounded-none border-x-0 border-t-0 border-b-2 border-transparent px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none'
                  >
                    {t(`tabs.${key}`)}
                    {tab === key ? (
                      <motion.span
                        layoutId='firm-tab-underline'
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        style={{ transformOrigin: 'left' }}
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                        className='border-primary pointer-events-none absolute inset-x-0 bottom-0 border-b-2'
                      />
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>
            </motion.div>

            <TabsContent value='overview'>
              <TabPanel direction={tabDirection}>
                <IntroCard contractor={contractor} onTagClick={goToProjectsTab} onOpenPhoto={setActivePhotoIndex} />
                <PartnershipSummary contractor={contractor} />
                <FeaturedProjects contractor={contractor} projectId={projectId} />
                <LegalChecks contractor={contractor} />
              </TabPanel>
            </TabsContent>

            <TabsContent value='projects'>
              <TabPanel direction={tabDirection}>
                <FeaturedProjects contractor={contractor} projectId={projectId} />
              </TabPanel>
            </TabsContent>

            <TabsContent value='legal'>
              <TabPanel direction={tabDirection}>
                <LegalChecks contractor={contractor} />
              </TabPanel>
            </TabsContent>

            <TabsContent value='partnership'>
              <TabPanel direction={tabDirection}>
                <PartnershipTab contractor={contractor} />
              </TabPanel>
            </TabsContent>
          </Tabs>
        </div>

        {/* Cột phải dính theo cuộn: nút "Mời báo giá" là hành động chính của màn,
            hồ sơ lại dài — để nó trôi mất là bắt người dùng cuộn ngược lên. */}
        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className='space-y-4 lg:sticky lg:top-24 lg:self-start'
        >
          <motion.section
            variants={revealContainerVariants}
            initial='hidden'
            animate='show'
            className='bg-card rounded-2xl border p-4'
          >
            <h2 className='text-base font-semibold'>{t('activity')}</h2>
            <ul className='mt-3 space-y-2'>
              {activityRows.map((row) => (
                <motion.li
                  variants={revealItemVariants}
                  key={row.key}
                  className='flex items-center gap-3 rounded-xl border px-3 py-2.5'
                >
                  <row.icon aria-hidden className='text-primary size-4 shrink-0' />
                  <div className='min-w-0'>
                    <p className='text-muted-foreground text-[11px] leading-tight'>{row.label}</p>
                    <p className='mt-0.5 truncate text-sm font-semibold'>{row.value}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.section>

          <div className='space-y-2.5'>
            {/* Hiện sau cùng + một nhịp thở (mục 11); tạm ngưng nhận dự án →
                nút mờ + dẫn hướng sang nhà thầu khác (mục 10). */}
            <motion.div
              className='h-11 [&>*]:h-11'
              animate={{ scale: inviteBreathe && contractor.acceptingProjects ? [1, 1.02, 1] : 1 }}
              transition={{ duration: 0.5 }}
            >
              <InviteButton
                projectId={projectId}
                contractorId={contractorId}
                contractor={contractor}
                preview={preview}
                invited={invited}
                inviteLocked={inviteLocked}
                navigating={navigatingInvite}
                onNavigate={() => setNavigatingInvite(true)}
                onOpenPicker={openPicker}
              />
            </motion.div>
            {!contractor.acceptingProjects ? (
              <>
                <p className='text-muted-foreground text-xs text-pretty'>{t('notAcceptingNotice')}</p>
                <Button asChild variant='outline' className='h-11 w-full'>
                  <Link href={contractorMatchesRoute(projectId)}>{t('viewSimilar')}</Link>
                </Button>
              </>
            ) : null}

            <Button
              variant='outline'
              className={cn('border-primary/50 text-primary-strong h-11 w-full', inCompare && 'border-primary')}
              onClick={() => toggleCompare(contractorId)}
            >
              {inCompare ? (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', bounce: 0.6, duration: 0.35 }}
                >
                  <CheckCircle2 className='size-4' />
                </motion.span>
              ) : (
                <Plus className='size-4' />
              )}
              {inCompare ? t('inCompare') : t('addToCompare')}
            </Button>
          </div>

          <p className='text-muted-foreground bg-muted/50 flex items-start gap-2 rounded-xl p-3 text-xs leading-relaxed'>
            <Lock className='mt-0.5 size-3.5 shrink-0' />
            <span>{t('contactLocked')}</span>
          </p>

          <button
            type='button'
            onClick={() => setReportOpen(true)}
            className='text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs'
          >
            <FileText className='size-3.5' />
            {t('report')}
          </button>
        </motion.aside>
      </div>

      {/* Cuộn qua khối nhận diện → dải tóm tắt dính dưới thanh điều hướng
          (mục 3); mobile: nút "Mời báo giá" dính đáy màn. */}
      <AnimatePresence>
        {barCollapsed ? (
          <motion.div
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -48, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className='bg-card/95 fixed inset-x-0 top-16 z-30 hidden border-b py-2 backdrop-blur-sm sm:block'
          >
            <div className={cn(PAGE_CONTAINER, 'flex items-center gap-3')}>
              <ContractorLogo contractor={contractor} className='size-8 shrink-0 rounded-md text-xs' />
              <span className='truncate text-sm font-medium'>{contractor.name}</span>
              <div className='ml-auto h-9 w-40 shrink-0 [&>*]:h-9'>
                <InviteButton
                  projectId={projectId}
                  contractorId={contractorId}
                  contractor={contractor}
                  preview={preview}
                  invited={invited}
                  inviteLocked={inviteLocked}
                  navigating={navigatingInvite}
                  onNavigate={() => setNavigatingInvite(true)}
                  onOpenPicker={openPicker}
                  size='sm'
                />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className='h-16 sm:hidden' aria-hidden />
      <div className='bg-card fixed inset-x-0 bottom-0 z-30 border-t p-3 sm:hidden'>
        <div className='h-11 [&>*]:h-11'>
          <InviteButton
            projectId={projectId}
            contractorId={contractorId}
            contractor={contractor}
            preview={preview}
            invited={invited}
            inviteLocked={inviteLocked}
            navigating={navigatingInvite}
            onNavigate={() => setNavigatingInvite(true)}
            onOpenPicker={openPicker}
          />
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>{t('reportConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('reportConfirmBody')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setReportOpen(false)}>
              {tGlobal('cancel')}
            </Button>
            <Button
              onClick={() => {
                setReportOpen(false)
                toast.success(t('reportSent'))
              }}
            >
              {t('reportConfirmAction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PhotoLightbox
        photos={contractor.photos}
        index={activePhotoIndex}
        onClose={() => setActivePhotoIndex(null)}
        onNavigate={setActivePhotoIndex}
      />

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
function IntroCard({
  contractor,
  onTagClick,
  onOpenPhoto
}: {
  contractor: Contractor
  /** Bấm một thẻ "thế mạnh" → chuyển sang tab "Dự án đã thực hiện" (mục 5). */
  onTagClick: () => void
  onOpenPhoto: (index: number) => void
}) {
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

        {/* Rê → nền xanh nhạt; bấm → chuyển sang tab "Dự án đã thực hiện"
            (mục 5). Không có dữ liệu nào gắn thế mạnh với TỪNG dự án trong
            `ContractorProject`, nên dừng ở việc mở đúng tab — chưa lọc thật
            theo tag, tránh vẽ ra một bộ lọc trông như hoạt động mà không có
            gì đứng sau nó. */}
        <ul className='mt-4 flex flex-wrap gap-2'>
          {contractor.strengths.map((strength) => (
            <li key={strength}>
              <button
                type='button'
                onClick={onTagClick}
                className='border-primary/40 text-primary-strong hover:bg-accent rounded-md border px-2.5 py-1 text-xs transition-colors'
              >
                {strength}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Ô lớn KHÔNG khóa tỉ lệ: trong ảnh mẫu bộ ảnh cao đúng bằng khối chữ bên
          trái, hai đáy thẳng hàng. Đặt `aspect-*` cho ô lớn thì nó dừng sớm hơn
          cột ảnh nhỏ bên cạnh, bộ ghép thành hình răng cưa. */}
      {lead ? (
        <motion.div
          variants={revealContainerVariants}
          initial='hidden'
          animate='show'
          className='grid min-h-52 min-w-0 gap-[1.8%] sm:grid-cols-[58.6%_minmax(0,1fr)]'
        >
          <CollagePhoto photo={lead} onOpen={() => onOpenPhoto(0)} />
          <div className='flex flex-col gap-2'>
            {rest.slice(0, 2).map((photo, index) => (
              <CollagePhoto
                key={photo.caption}
                photo={photo}
                className='min-h-24 flex-1'
                onOpen={() => onOpenPhoto(index + 1)}
              />
            ))}
          </div>
        </motion.div>
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
function CollagePhoto({
  photo,
  className,
  onOpen
}: {
  photo: ContractorPhoto
  className?: string
  onOpen?: () => void
}) {
  if (!photo.url) {
    return (
      <motion.div
        variants={revealItemVariants}
        className={cn(
          'bg-muted/30 text-muted-foreground/70 flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed p-2 text-center',
          className
        )}
      >
        <ImageIcon aria-hidden className='size-5 shrink-0' />
        <p className='text-xs'>{photo.caption}</p>
      </motion.div>
    )
  }

  return (
    <motion.button
      type='button'
      variants={revealItemVariants}
      onClick={onOpen}
      className={cn('group relative min-w-0 overflow-hidden rounded-xl border text-left', className)}
    >
      {/* `alt` để trống: chú thích ngay bên dưới đã mô tả ảnh, đặt cả hai thì
          trình đọc màn hình đọc trùng hai lần. `RevealPhoto` đã tự lo hiện
          mờ→nét lúc tải và phóng nhẹ khi rê (mục 6). */}
      <RevealPhoto src={photo.url} alt='' className='size-full' sizes='(max-width: 768px) 100vw, 360px' />
      {/* Lớp tối + biểu tượng xem khi rê (mục 6). */}
      <span className='absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-[background-color,opacity] duration-200 group-hover:bg-black/30 group-hover:opacity-100'>
        <Eye className='size-6 text-white' />
      </span>
      <p className='pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent px-3 pt-6 pb-2 text-xs font-medium text-white'>
        {photo.caption}
      </p>
    </motion.button>
  )
}

/**
 * Hộp phóng ảnh doanh nghiệp (mục 6) — phóng ra từ đúng ảnh vừa bấm, mũi tên
 * chuyển ảnh, Esc/bấm nền để đóng.
 *
 * Đơn giản hoá so với mô tả: bỏ vuốt để chuyển ảnh trên di động và bỏ hiệu
 * ứng "phóng từ đúng vị trí ảnh" (origin) — bộ ảnh chỉ 1–3 tấm và không có
 * layout cố định giữa các khổ màn để tính toạ độ nguồn đáng tin cậy; hộp vẫn
 * phóng to/thu nhỏ từ giữa màn, chỉ là không bắt đầu đúng tại vị trí ảnh.
 */
function PhotoLightbox({
  photos,
  index,
  onClose,
  onNavigate
}: {
  photos: ContractorPhoto[]
  index: number | null
  onClose: () => void
  onNavigate: (nextIndex: number) => void
}) {
  useEffect(() => {
    if (index === null) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') onNavigate((index - 1 + photos.length) % photos.length)
      if (event.key === 'ArrowRight') onNavigate((index + 1) % photos.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [index, photos.length, onClose, onNavigate])

  const photo = index !== null ? photos[index] : undefined

  return (
    <AnimatePresence>
      {photo?.url ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6'
        >
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.25 }}
            className='relative aspect-video w-full max-w-3xl overflow-hidden rounded-2xl'
          >
            <Photo src={photo.url} alt='' className='size-full' sizes='90vw' />
            <p className='absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent px-4 pt-8 pb-3 text-sm font-medium text-white'>
              {photo.caption}
            </p>
          </motion.div>

          <button
            type='button'
            onClick={onClose}
            aria-label='Close'
            className='absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20'
          >
            <X className='size-4' />
          </button>

          {photos.length > 1 ? (
            <>
              <button
                type='button'
                onClick={(event) => {
                  event.stopPropagation()
                  onNavigate(((index ?? 0) - 1 + photos.length) % photos.length)
                }}
                aria-label='Previous photo'
                className='absolute left-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20'
              >
                <ChevronLeft className='size-5' />
              </button>
              <button
                type='button'
                onClick={(event) => {
                  event.stopPropagation()
                  onNavigate(((index ?? 0) + 1) % photos.length)
                }}
                aria-label='Next photo'
                className='absolute right-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20'
              >
                <ChevronRight className='size-5' />
              </button>
            </>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
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
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.4, ease: revealEase }}
      className='bg-card flex flex-wrap items-center gap-4 rounded-2xl border p-4'
    >
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
    </motion.section>
  )
}

/** Khối "Dự án tiêu biểu": ảnh bên trái, tên + năm + liên kết bên phải. */
function FeaturedProjects({ contractor, projectId }: { contractor: Contractor; projectId: string }) {
  const t = useTranslations('contractors.firm')

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, ease: revealEase }}
      className='bg-card rounded-2xl border p-4'
    >
      <h2 className='text-base font-semibold'>{t('featured')}</h2>
      <ul className='mt-3 grid gap-x-[3%] gap-y-4 sm:grid-cols-3'>
        {contractor.featuredProjects.map((project) => (
          <li key={project.id} className='group flex min-w-0 gap-3'>
            {project.imageUrl ? (
              <div className='w-1/2 shrink-0 overflow-hidden rounded-lg'>
                <RevealPhoto
                  src={project.imageUrl}
                  alt={project.name}
                  className='aspect-video size-full'
                  sizes='(max-width: 768px) 40vw, 160px'
                />
              </div>
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
                {t('viewProject')}
                <span className='inline-block transition-transform group-hover:translate-x-1'>→</span>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </motion.section>
  )
}

/** Khối "Năng lực & xác minh" — bốn mục đã được SAVICO đối chiếu. */
function LegalChecks({ contractor }: { contractor: Contractor }) {
  const t = useTranslations('contractors.firm')

  return (
    <section className='bg-card rounded-2xl border p-4'>
      <h2 className='text-base font-semibold'>{t('legalTitle')}</h2>
      <motion.ul
        variants={revealContainerVariants}
        initial='hidden'
        whileInView='show'
        viewport={{ once: true, amount: 0.4 }}
        className='mt-3 grid gap-x-[3%] gap-y-3 sm:grid-cols-2 lg:grid-cols-4'
      >
        {contractor.legalChecks.map((check) => (
          <motion.li
            variants={revealItemVariants}
            key={check}
            transition={{ type: 'spring', bounce: 0.5, duration: 0.4 }}
            className='flex items-start gap-2.5 text-sm'
          >
            <CircleCheck className='text-primary mt-0.5 size-4 shrink-0' />
            <span className='text-muted-foreground text-pretty'>{check}</span>
          </motion.li>
        ))}
      </motion.ul>
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
