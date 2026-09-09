'use client'

import { ArrowRight, BadgeCheck, Circle, CircleCheck, FileText, Info, Minus, Star } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { Link, useRouter } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { EmptyState } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
  CONTRACTOR_PREVIEW_ID,
  contractorFirmRoute,
  contractorInviteRoute,
  contractorMatchesRoute
} from '@/shared/constants/routes'
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
  const startInviteQueue = useContractorsStore((s) => s.startInviteQueue)

  const [picked, setPicked] = useState<string[]>([])

  const rows = (contractors ?? []).filter((c) => compareIds.includes(c.id))
  const room = remainingInvites(invitations ?? [])

  const togglePick = (contractorId: string) =>
    setPicked((current) =>
      current.includes(contractorId)
        ? current.filter((id) => id !== contractorId)
        : current.length >= room
          ? current
          : [...current, contractorId]
    )

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

  return (
    <div className='mx-auto w-[94%] max-w-[88rem] space-y-5 py-8'>
      {preview ? null : <ProjectContextBar brief={brief} compact />}

      {/* Liên kết quay lại nằm sát mép trái, tiêu đề canh giữa TRANG chứ không
          canh giữa phần còn lại — nên nó được nhấc ra khỏi luồng ở màn rộng. */}
      <div className='relative space-y-3 lg:space-y-0'>
        <Link
          href={contractorMatchesRoute(projectId)}
          className='text-primary-strong inline-flex items-center gap-2 text-sm font-medium lg:absolute lg:top-1 lg:left-0'
        >
          ← {tCommon('backToList')}
        </Link>

        <header className='space-y-1 text-center'>
          <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>{t('title')}</h1>
          <p className='text-muted-foreground text-pretty'>{t('subtitle')}</p>
        </header>
      </div>

      <p className='text-info-foreground bg-info-soft mx-auto flex w-fit max-w-3xl items-start gap-2 rounded-xl px-4 py-3 text-sm'>
        <Info className='text-info mt-0.5 size-4 shrink-0' />
        <span className='text-pretty'>{t('lead')}</span>
      </p>

      {isPending ? (
        <Skeleton className='h-96 rounded-2xl' />
      ) : rows.length < MIN_COMPARE ? (
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
          <div className='bg-card overflow-x-auto rounded-2xl border'>
            <table className='w-full min-w-[640px] border-collapse text-sm'>
              <thead>
                <tr>
                  <th className='bg-card sticky left-0 z-10 w-[19%] border-r border-b p-4 text-left align-middle font-medium'>
                    {t('criterion')}
                  </th>
                  {rows.map((contractor) => (
                    <th
                      key={contractor.id}
                      className='w-[27%] border-b border-l p-4 text-left align-middle font-normal'
                    >
                      <div className='flex items-center gap-3'>
                        <ContractorLogo contractor={contractor} className='size-14 shrink-0' />
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
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {COMPARE_CRITERIA.map((criterion) => (
                  <tr key={criterion} className='border-b'>
                    <th className='bg-card sticky left-0 z-10 border-r p-3.5 text-left text-sm font-normal'>
                      {t(`criteria.${criterion}`)}
                    </th>
                    {rows.map((contractor) => (
                      <td key={contractor.id} className='border-l p-3.5 text-center'>
                        <CriterionValue criterion={criterion} contractor={contractor} locale={locale} />
                      </td>
                    ))}
                  </tr>
                ))}

                <tr>
                  <th className='bg-card sticky left-0 z-10 border-r p-3.5 text-left text-sm font-normal'>
                    {t('select')}
                  </th>
                  {rows.map((contractor) => {
                    const isPicked = picked.includes(contractor.id)
                    return (
                      <td key={contractor.id} className='border-l p-3.5'>
                        {/* Vòng tròn rỗng / vòng tròn có dấu tick: nhìn là biết ô
                            nào đang được chọn mà không phải đọc chữ. */}
                        <Button
                          variant={isPicked ? 'default' : 'outline'}
                          className={cn('h-11 w-full', !isPicked && 'border-primary/50 text-primary-strong')}
                          onClick={() => togglePick(contractor.id)}
                          disabled={!isPicked && picked.length >= room}
                        >
                          {isPicked ? <CircleCheck className='size-4' /> : <Circle className='size-4' />}
                          {isPicked ? t('selected') : t('select')}
                        </Button>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Thanh hành động cuối bảng — hai nút theo đúng S15. */}
          <div className='bg-card flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4'>
            <div className='min-w-0 text-sm'>
              <p className='font-medium'>
                {t('footerHint', { max: Math.min(MAX_INVITATIONS, room), total: rows.length })}
              </p>
              <p
                className={cn(
                  'mt-0.5 truncate text-xs',
                  pickedNames.length > 0 ? 'text-primary-strong' : 'text-muted-foreground'
                )}
              >
                {pickedNames.length > 0 ? t('footerSelected', { names: pickedNames.join(', ') }) : t('footerEmpty')}
              </p>
            </div>

            <div className='flex flex-wrap gap-2'>
              <Button asChild variant='outline'>
                <Link href={contractorMatchesRoute(projectId)}>{t('back')}</Link>
              </Button>
              <Button onClick={invitePicked} disabled={picked.length === 0}>
                {t('invite')}
                <ArrowRight className='size-4' />
              </Button>
            </div>
          </div>
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
