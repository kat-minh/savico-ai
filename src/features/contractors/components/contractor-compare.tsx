'use client'

import { ArrowRight, BadgeCheck, Circle, CircleCheck, FileText, Info, Minus, Star, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { Link, useRouter } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { EmptyState, revealEase } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Switch } from '@/shared/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import {
  CONTRACTOR_PREVIEW_ID,
  contractorFirmRoute,
  contractorInviteRoute,
  contractorMatchesRoute
} from '@/shared/constants/routes'
import { usePastElement } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'
import { formatNumber } from '@/shared/utils'
import { COMPARE_CRITERIA, MAX_INVITATIONS, MIN_COMPARE } from '../constants/contractors.constants'
import { useBrief } from '../hooks/use-brief'
import { useContractors } from '../hooks/use-contractors'
import { useInvitations } from '../hooks/use-invitations'
import { remainingInvites } from '../services/contractor-list.service'
import { useContractorsStore } from '../store/contractors.store'
import type { Contractor } from '../types/contractor.types'
import { ContractorLogo } from './contractor-logo'
import { useProjectPickerStore } from '../store/project-picker.store'
import { ProjectContextBar } from './project-context-bar'
import { ProjectPickerDialog } from './project-picker-dialog'

/** Neo cho `usePastElement` — cuộn qua thì hàng đầu bảng dính trên + đổ bóng (mục 3). */
const TABLE_TOP_ANCHOR_ID = 'compare-table-anchor'

/**
 * Tiêu chí nào "càng thấp càng tốt" — phần còn lại trong {@link NUMERIC_CRITERIA}
 * mặc định càng cao càng tốt. Dùng để tô nổi ô giá trị tốt hơn (mục 4).
 */
const LOWER_IS_BETTER = new Set(['distance', 'surveyTime'])

/** Tiêu chí có thể so sánh hơn-kém bằng số — bốn tiêu chí còn lại là văn bản/nhị phân. */
const NUMERIC_CRITERIA = {
  rating: (c: Contractor) => c.rating,
  similarProjects: (c: Contractor) => c.similarProjects,
  distance: (c: Contractor) => c.distanceKm,
  surveyTime: (c: Contractor) => c.surveyWithinHours,
  warranty: (c: Contractor) => c.warrantyMonths
} as const satisfies Partial<Record<(typeof COMPARE_CRITERIA)[number], (c: Contractor) => number>>

interface ContractorCompareProps {
  projectId: string
}

/**
 * So sánh hồ sơ nhà thầu (S15).
 *
 * R1: cho chọn tối đa 3 nhà thầu để mời — bản demo chỉ cho chọn 1, ở đây là
 * chọn nhiều. R2: bảng KHÔNG có dòng nào về giá; dòng dẫn ngay dưới tiêu đề nói
 * rõ đây là so sánh năng lực.
 *
 * Bảng đặt trong khung `overflow-x-auto` với cột tiêu chí `sticky left-0`: ba
 * cột nhà thầu không co thêm được nữa thì bảng cuộn ngang, người đọc vẫn thấy
 * mình đang ở dòng tiêu chí nào.
 */
export function ContractorCompare({ projectId }: ContractorCompareProps) {
  const t = useTranslations('contractors.compare')
  const tCommon = useTranslations('contractors.common')
  const locale = useLocale() as Locale
  const router = useRouter()

  const openPicker = useProjectPickerStore((s) => s.openPicker)
  /** Xem thử — chưa gắn hồ sơ dự án nào (xem `CONTRACTOR_PREVIEW_ID`). */
  const preview = projectId === CONTRACTOR_PREVIEW_ID

  const { data: brief } = useBrief(projectId)
  const { data: contractors, isPending } = useContractors(projectId)
  const { data: invitations } = useInvitations(projectId)

  const compareIds = useContractorsStore((s) => s.compareIds)
  const toggleCompare = useContractorsStore((s) => s.toggleCompare)
  const startInviteQueue = useContractorsStore((s) => s.startInviteQueue)

  const [picked, setPicked] = useState<string[]>([])
  /** Làm nổi ô giá trị tốt hơn — công tắc tắt/mở (mục 4). */
  const [highlightBetter, setHighlightBetter] = useState(true)
  /** Rê cả hàng/cột để tô sáng (mục 4). */
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null)
  /** Chọn vượt lượt còn lại → ô rung + thông báo (mục 5). */
  const [exceedShakeId, setExceedShakeId] = useState<string | null>(null)

  /** Nút "Mời" thở một nhịp ngay khi vừa có nhà thầu đầu tiên được chọn (mục 6). */
  const wasAnyPickedRef = useRef(false)
  const [inviteBreathe, setInviteBreathe] = useState(false)
  useEffect(() => {
    if (picked.length > 0 && !wasAnyPickedRef.current) {
      setInviteBreathe(true)
      const timer = window.setTimeout(() => setInviteBreathe(false), 500)
      wasAnyPickedRef.current = true
      return () => window.clearTimeout(timer)
    }
    wasAnyPickedRef.current = picked.length > 0
  }, [picked.length])

  const rows = (contractors ?? []).filter((c) => compareIds.includes(c.id))
  const room = remainingInvites(invitations ?? [])

  const togglePick = (contractorId: string) =>
    setPicked((current) => {
      if (current.includes(contractorId)) return current.filter((id) => id !== contractorId)
      if (current.length >= room) {
        setExceedShakeId(contractorId)
        window.setTimeout(() => setExceedShakeId(null), 450)
        return current
      }
      return [...current, contractorId]
    })

  /** Giá trị tốt hơn theo từng tiêu chí có thể so bằng số (mục 4). */
  const betterIdByCriterion = new Map<string, string>()
  for (const [criterion, getValue] of Object.entries(NUMERIC_CRITERIA)) {
    if (rows.length < 2) continue
    const values = rows.map((c) => getValue(c))
    const best = LOWER_IS_BETTER.has(criterion) ? Math.min(...values) : Math.max(...values)
    // Bằng nhau thì không đánh dấu ai — không phải "tốt hơn" ai cả.
    if (values.filter((v) => v === best).length > 1) continue
    const winner = rows.find((c) => getValue(c) === best)
    if (winner) betterIdByCriterion.set(criterion, winner.id)
  }

  /** Mời hàng loạt: xếp hàng đợi rồi mở màn chọn lịch của nhà thầu đầu tiên (S16). */
  const invitePicked = () => {
    // Xem thử: chưa có dự án để gắn lời mời — mở hộp thoại chọn dự án trước.
    if (preview) {
      openPicker()
      return
    }
    if (picked.length === 0) return
    startInviteQueue(picked)
    const first = picked[0]
    if (first) router.push(contractorInviteRoute(projectId, first))
  }

  const pickedNames = rows.filter((c) => picked.includes(c.id)).map((c) => c.name)

  const colWidth = rows.length > 0 ? `${(100 - 19) / rows.length}%` : undefined
  const tableTopPast = usePastElement(TABLE_TOP_ANCHOR_ID)

  return (
    <div className='mx-auto w-[94%] max-w-[88rem] space-y-5 py-8'>
      {preview ? null : <ProjectContextBar brief={brief} compact />}

      {/* Liên kết quay lại nằm sát mép trái, tiêu đề canh giữa TRANG chứ không
          canh giữa phần còn lại — nên nó được nhấc ra khỏi luồng ở màn rộng. */}
      <div className='relative space-y-3 lg:space-y-0'>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <Link
            href={contractorMatchesRoute(projectId)}
            className='text-primary-strong inline-flex items-center gap-2 text-sm font-medium lg:absolute lg:top-1 lg:left-0'
          >
            ← {tCommon('backToList')}
          </Link>
        </motion.div>

        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className='space-y-1 text-center'
        >
          <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>{t('title')}</h1>
          <p className='text-muted-foreground text-pretty'>{t('subtitle')}</p>
        </motion.header>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className='text-info-foreground bg-info-soft mx-auto flex w-fit max-w-3xl items-start gap-2 rounded-xl px-4 py-3 text-sm'
      >
        <Info className='text-info mt-0.5 size-4 shrink-0' />
        <AnimatePresence mode='wait'>
          <motion.span
            key={rows.length === 1 ? 'one' : 'lead'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className='text-pretty'
          >
            {rows.length === 1 ? t('tooFewInline', { count: MIN_COMPARE - rows.length }) : t('lead')}
          </motion.span>
        </AnimatePresence>
      </motion.p>

      {isPending ? (
        <Skeleton className='h-96 rounded-2xl' />
      ) : rows.length === 0 ? (
        <EmptyState
          title={t('tooFew', { min: MIN_COMPARE })}
          action={
            <Button asChild variant='outline'>
              <Link href={contractorMatchesRoute(projectId)}>{t('back')}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div id={TABLE_TOP_ANCHOR_ID} className='bg-card overflow-x-auto rounded-2xl border'>
            <table className='w-full min-w-[640px] border-collapse text-sm'>
              <thead>
                <tr
                  className={cn(
                    'bg-card sticky top-16 z-20 transition-shadow',
                    tableTopPast && 'shadow-[0_4px_10px_-6px_rgba(0,0,0,0.25)]'
                  )}
                >
                  <th className='bg-card sticky left-0 z-10 w-[19%] border-r border-b p-4 text-left align-middle font-medium'>
                    {t('criterion')}
                  </th>
                  <AnimatePresence initial={false}>
                    {rows.map((contractor, index) => (
                      <th
                        key={contractor.id}
                        style={{ width: colWidth }}
                        onMouseEnter={() => setHoveredColumn(contractor.id)}
                        onMouseLeave={() => setHoveredColumn((current) => (current === contractor.id ? null : current))}
                        className={cn(
                          'group relative border-b border-l p-4 text-left align-middle font-normal transition-colors',
                          picked.includes(contractor.id)
                            ? 'border-primary bg-accent/30 border-t-2 border-r-2 border-l-2'
                            : hoveredColumn === contractor.id && 'bg-accent/20'
                        )}
                      >
                        {/* Rê tiêu đề cột → nút × hiện (mục 3). */}
                        <button
                          type='button'
                          aria-label={t('removeColumn')}
                          onClick={() => toggleCompare(contractor.id)}
                          className='text-muted-foreground hover:text-destructive hover:bg-muted absolute top-2 right-2 flex size-6 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100'
                        >
                          <X className='size-3.5' />
                        </button>

                        <motion.div
                          key={contractor.id}
                          layout
                          initial={{ opacity: 0, x: 24 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.06, ease: revealEase }}
                          className='flex items-center gap-3'
                        >
                          <motion.div
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', bounce: 0.5, duration: 0.4, delay: index * 0.06 + 0.1 }}
                          >
                            <ContractorLogo contractor={contractor} className='size-14 shrink-0' />
                          </motion.div>
                          <div className='min-w-0'>
                            <span className='flex items-center gap-1.5 text-sm font-semibold'>
                              <span className='truncate'>{contractor.name}</span>
                              {contractor.verified ? <BadgeCheck className='text-primary size-4 shrink-0' /> : null}
                            </span>
                            <span className='mt-1 flex items-center gap-1.5 text-sm'>
                              <Star className='text-warning size-4 shrink-0 fill-current' />
                              {formatNumber(contractor.rating, locale, { minimumFractionDigits: 1 })}/5
                            </span>
                            <Button
                              asChild
                              size='sm'
                              variant='outline'
                              className='border-primary/50 text-primary-strong mt-2'
                            >
                              <Link href={contractorFirmRoute(projectId, contractor.id)}>
                                <FileText className='size-4' />
                                {tCommon('viewProfile')}
                              </Link>
                            </Button>
                          </div>
                        </motion.div>
                      </th>
                    ))}
                  </AnimatePresence>
                </tr>
              </thead>

              <tbody>
                {COMPARE_CRITERIA.map((criterion, rowIndex) => {
                  const betterId = highlightBetter ? betterIdByCriterion.get(criterion) : undefined
                  return (
                    <motion.tr
                      key={criterion}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: rowIndex * 0.04 }}
                      onMouseEnter={() => setHoveredRow(criterion)}
                      onMouseLeave={() => setHoveredRow((current) => (current === criterion ? null : current))}
                      className={cn('border-b transition-colors', hoveredRow === criterion && 'bg-muted/40')}
                    >
                      <th className='bg-card sticky left-0 z-10 border-r p-3.5 text-left text-sm font-normal'>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className='cursor-help underline decoration-dotted underline-offset-4'>
                              {t(`criteria.${criterion}`)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{t(`criteriaHint.${criterion}`)}</TooltipContent>
                        </Tooltip>
                      </th>
                      {rows.map((contractor) => {
                        const isBetter = betterId === contractor.id
                        return (
                          <td
                            key={contractor.id}
                            className={cn(
                              'border-l p-3.5 text-center transition-colors',
                              picked.includes(contractor.id) && 'border-primary border-r-2 border-l-2',
                              hoveredColumn === contractor.id && 'bg-accent/20'
                            )}
                          >
                            <span
                              className={cn(
                                'inline-flex items-center gap-2 rounded-lg px-2 py-1',
                                isBetter && 'bg-accent/60'
                              )}
                            >
                              <CriterionValue criterion={criterion} contractor={contractor} locale={locale} />
                              <AnimatePresence>
                                {isBetter ? (
                                  <motion.span
                                    initial={{ opacity: 0, scale: 0.7 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.7 }}
                                    transition={{ duration: 0.25 }}
                                    className='bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap'
                                  >
                                    {t('betterBadge')}
                                  </motion.span>
                                ) : null}
                              </AnimatePresence>
                            </span>
                          </td>
                        )
                      })}
                    </motion.tr>
                  )
                })}

                <tr>
                  <th className='bg-card sticky left-0 z-10 border-r p-3.5 text-left text-sm font-normal'>
                    {t('select')}
                  </th>
                  {rows.map((contractor) => {
                    const isPicked = picked.includes(contractor.id)
                    return (
                      <td
                        key={contractor.id}
                        className={cn(
                          'border-l p-3.5',
                          isPicked && 'border-primary border-r-2 border-b-2 border-l-2',
                          hoveredColumn === contractor.id && 'bg-accent/20'
                        )}
                      >
                        {/* Vòng tròn rỗng / vòng tròn có dấu tick: nhìn là biết ô
                            nào đang được chọn mà không phải đọc chữ. Chọn vượt
                            lượt còn lại → rung + thông báo thay vì khoá cứng im
                            lặng (mục 5). */}
                        <motion.span
                          animate={exceedShakeId === contractor.id ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                          transition={{ duration: 0.4 }}
                          className='block'
                        >
                          <Button
                            variant={isPicked ? 'default' : 'outline'}
                            className={cn('h-11 w-full', !isPicked && 'border-primary/50 text-primary-strong')}
                            onClick={() => togglePick(contractor.id)}
                            title={!isPicked && picked.length >= room ? t('exceedRoom', { count: room }) : undefined}
                          >
                            {isPicked ? <CircleCheck className='size-4' /> : <Circle className='size-4' />}
                            {isPicked ? t('selected') : t('select')}
                          </Button>
                        </motion.span>
                        <AnimatePresence>
                          {exceedShakeId === contractor.id ? (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className='text-brand-orange mt-1.5 overflow-hidden text-xs'
                            >
                              {t('exceedRoom', { count: room })}
                            </motion.p>
                          ) : null}
                        </AnimatePresence>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Công tắc làm nổi điểm tốt hơn — bên trên thanh hành động (mục 4). */}
          <div className='flex items-center justify-end gap-2.5 text-sm'>
            <label htmlFor='highlight-better' className='text-muted-foreground'>
              {t('highlightToggle')}
            </label>
            <Switch id='highlight-better' checked={highlightBetter} onCheckedChange={setHighlightBetter} />
          </div>

          {/* Thanh hành động cuối bảng — hai nút theo đúng S15. Trượt lên sau
              cùng (mục 6). */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: revealEase }}
            className='bg-card flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4'
          >
            <div className='min-w-0 text-sm'>
              <p className='font-medium'>
                {t('footerHint', { max: Math.min(MAX_INVITATIONS, room), total: rows.length })}
              </p>
              <AnimatePresence mode='wait'>
                <motion.p
                  key={pickedNames.join(',')}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'mt-0.5 truncate text-xs',
                    pickedNames.length > 0 ? 'text-primary-strong' : 'text-muted-foreground'
                  )}
                >
                  {pickedNames.length > 0 ? t('footerSelected', { names: pickedNames.join(', ') }) : t('footerEmpty')}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className='flex flex-wrap gap-2'>
              <Button asChild variant='outline'>
                <Link href={contractorMatchesRoute(projectId)}>{t('back')}</Link>
              </Button>
              <motion.span
                animate={{ scale: inviteBreathe ? [1, 1.03, 1] : 1 }}
                transition={{ duration: 0.5 }}
                className='inline-block'
              >
                <Button onClick={invitePicked} disabled={picked.length === 0}>
                  {t('invite')}
                  <ArrowRight className='size-4' />
                </Button>
              </motion.span>
            </div>
          </motion.div>
        </>
      )}

      <ProjectPickerDialog />
    </div>
  )
}

/** Một ô giá trị trong bảng so sánh — không tiêu chí nào liên quan tới giá (R2). */
function CriterionValue({
  criterion,
  contractor,
  locale
}: {
  criterion: (typeof COMPARE_CRITERIA)[number]
  contractor: Contractor
  locale: Locale
}) {
  const t = useTranslations('contractors.compare')
  const tCommon = useTranslations('contractors.common')

  switch (criterion) {
    case 'rating':
      return <span>{formatNumber(contractor.rating, locale, { minimumFractionDigits: 1 })}/5</span>
    case 'similarProjects':
      return <span>{contractor.similarProjects}</span>
    case 'distance':
      return (
        <span>
          {tCommon('distanceShort', { km: formatNumber(contractor.distanceKm, locale, { minimumFractionDigits: 1 }) })}
        </span>
      )
    case 'surveyTime':
      return <span>{t('surveyValue', { hours: contractor.surveyWithinHours })}</span>
    case 'serviceAreas':
      return <span>{contractor.serviceAreas.join(', ')}</span>
    case 'legal':
      return <span>{t('legalVerified')}</span>
    case 'warranty':
      return <span>{t('warrantyValue', { months: contractor.warrantyMonths })}</span>
    case 'accepting':
      return contractor.acceptingProjects ? (
        <CircleCheck className='text-primary mx-auto size-4' />
      ) : (
        <Minus className='text-muted-foreground mx-auto size-4' />
      )
  }
}
