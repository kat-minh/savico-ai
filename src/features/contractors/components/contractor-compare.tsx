'use client'

import { BadgeCheck, Check, CircleCheck, Info, Minus, Send } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { Link, useRouter } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { EmptyState } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { contractorFirmRoute, contractorInviteRoute, contractorMatchesRoute } from '@/shared/constants/routes'
import { formatNumber } from '@/shared/utils'
import { COMPARE_CRITERIA, MAX_INVITATIONS, MIN_COMPARE } from '../constants/contractors.constants'
import { useBrief } from '../hooks/use-brief'
import { useContractors } from '../hooks/use-contractors'
import { useInvitations } from '../hooks/use-invitations'
import { remainingInvites } from '../services/contractor-list.service'
import { useContractorsStore } from '../store/contractors.store'
import type { Contractor } from '../types/contractor.types'
import { ContractorLogo } from './contractor-logo'
import { ProjectContextBar } from './project-context-bar'

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
    if (picked.length === 0) return
    startInviteQueue(picked)
    const first = picked[0]
    if (first) router.push(contractorInviteRoute(projectId, first))
  }

  const pickedNames = rows.filter((c) => picked.includes(c.id)).map((c) => c.name)

  return (
    <div className='mx-auto w-full max-w-6xl space-y-5 px-4 py-8 lg:px-8'>
      <ProjectContextBar brief={brief} compact />

      <header className='space-y-1 text-center'>
        <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>{t('title')}</h1>
        <p className='text-muted-foreground text-pretty'>{t('subtitle')}</p>
      </header>

      <p className='text-primary-strong bg-accent/50 mx-auto flex max-w-3xl items-start gap-2 rounded-xl px-4 py-3 text-sm'>
        <Info className='mt-0.5 size-4 shrink-0' />
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
                  <th className='bg-card sticky left-0 z-10 w-40 border-b border-r p-4 text-left align-bottom font-medium'>
                    {t('criterion')}
                  </th>
                  {rows.map((contractor) => (
                    <th key={contractor.id} className='border-b p-4 text-center align-bottom font-normal'>
                      <div className='flex flex-col items-center gap-2'>
                        <ContractorLogo contractor={contractor} className='size-12' />
                        <span className='inline-flex items-center gap-1 text-sm font-semibold'>
                          {contractor.name}
                          {contractor.verified ? <BadgeCheck className='text-primary size-4' /> : null}
                        </span>
                        <Button asChild size='sm' variant='outline'>
                          <Link href={contractorFirmRoute(projectId, contractor.id)}>{tCommon('viewProfile')}</Link>
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {COMPARE_CRITERIA.map((criterion) => (
                  <tr key={criterion} className='even:bg-muted/30'>
                    <th className='bg-card sticky left-0 z-10 border-r p-3.5 text-left text-xs font-medium'>
                      {t(`criteria.${criterion}`)}
                    </th>
                    {rows.map((contractor) => (
                      <td key={contractor.id} className='p-3.5 text-center'>
                        <CriterionValue criterion={criterion} contractor={contractor} locale={locale} />
                      </td>
                    ))}
                  </tr>
                ))}

                <tr>
                  <th className='bg-card sticky left-0 z-10 border-t border-r p-3.5 text-left text-xs font-medium'>
                    {t('select')}
                  </th>
                  {rows.map((contractor) => {
                    const isPicked = picked.includes(contractor.id)
                    return (
                      <td key={contractor.id} className='border-t p-3.5 text-center'>
                        <Button
                          size='sm'
                          variant={isPicked ? 'default' : 'outline'}
                          className='w-full max-w-52'
                          onClick={() => togglePick(contractor.id)}
                          disabled={!isPicked && picked.length >= room}
                        >
                          {isPicked ? <Check className='size-4' /> : null}
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
              <p className='font-medium'>{t('footerHint', { max: Math.min(MAX_INVITATIONS, room) })}</p>
              <p className='text-muted-foreground truncate text-xs'>
                {pickedNames.length > 0 ? t('footerSelected', { names: pickedNames.join(', ') }) : t('footerEmpty')}
              </p>
            </div>

            <div className='flex flex-wrap gap-2'>
              <Button asChild variant='outline'>
                <Link href={contractorMatchesRoute(projectId)}>{t('back')}</Link>
              </Button>
              <Button onClick={invitePicked} disabled={picked.length === 0}>
                <Send className='size-4' />
                {t('invite')}
              </Button>
            </div>
          </div>
        </>
      )}
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
  const tFirm = useTranslations('contractors.firm')

  switch (criterion) {
    case 'rating':
      return (
        <span className='font-medium'>{formatNumber(contractor.rating, locale, { minimumFractionDigits: 1 })}/5</span>
      )
    case 'similarProjects':
      return <span>{contractor.similarProjects}</span>
    case 'distance':
      return <span>{formatNumber(contractor.distanceKm, locale, { minimumFractionDigits: 1 })} km</span>
    case 'surveyTime':
      return <span>{tCommon('surveyWithin', { hours: contractor.surveyWithinHours })}</span>
    case 'serviceAreas':
      return <span className='text-xs'>{contractor.serviceAreas.join(', ')}</span>
    case 'legal':
      return (
        <span className='text-primary inline-flex items-center gap-1.5 text-xs'>
          <CircleCheck className='size-3.5' />
          {t('legalVerified')}
        </span>
      )
    case 'warranty':
      return <span>{tFirm('warranty', { months: contractor.warrantyMonths })}</span>
    case 'accepting':
      return contractor.acceptingProjects ? (
        <CircleCheck className='text-primary mx-auto size-4' />
      ) : (
        <Minus className='text-muted-foreground mx-auto size-4' />
      )
  }
}
