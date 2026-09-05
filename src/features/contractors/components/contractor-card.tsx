'use client'

import { BadgeCheck, CircleCheck, FileText, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { contractorFirmRoute, contractorInviteRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { MAX_INVITATIONS } from '../constants/contractors.constants'
import type { Contractor } from '../types/contractor.types'
import { ContractorLogo } from './contractor-logo'
import { ContractorStats } from './contractor-stats'

interface ContractorCardProps {
  contractor: Contractor
  projectId: string
  /** Đang được tick để so sánh (S12). */
  compared: boolean
  onToggleCompare: (contractorId: string) => void
  /** Nhà thầu này đã được mời cho dự án đang xét. */
  invited: boolean
  /** Dự án đã đủ 3 lời mời — R1. */
  inviteLocked: boolean
}

/**
 * Một thẻ trong danh sách "Nhà thầu được đề xuất" (S12).
 *
 * Bố cục: ô tick So sánh + logo bên trái, khối thông tin ở giữa, hai nút hành
 * động xếp dọc bên phải. Nút "Mời báo giá" khóa khi dự án đã đủ 3 lời mời (R1)
 * — khóa chứ không ẩn, để người dùng hiểu vì sao không bấm được.
 */
export function ContractorCard({
  contractor,
  projectId,
  compared,
  onToggleCompare,
  invited,
  inviteLocked
}: ContractorCardProps) {
  const t = useTranslations('contractors.common')
  const tMatches = useTranslations('contractors.matches')

  const disabled = invited || inviteLocked

  return (
    <article
      className={cn(
        'bg-card flex flex-col gap-4 rounded-2xl border p-4 transition-colors sm:flex-row sm:items-start sm:p-5',
        compared ? 'border-primary/60 bg-accent/30' : 'hover:border-primary/40'
      )}
    >
      <div className='flex items-center gap-3 sm:flex-col sm:gap-2'>
        <label className='text-muted-foreground flex cursor-pointer flex-col items-center gap-1 text-[11px]'>
          <Checkbox
            checked={compared}
            onCheckedChange={() => onToggleCompare(contractor.id)}
            aria-label={`${tMatches('compareCheckbox')} ${contractor.name}`}
          />
          <span className='hidden sm:block'>{tMatches('compareCheckbox')}</span>
        </label>
        <ContractorLogo contractor={contractor} />
      </div>

      <div className='min-w-0 flex-1 space-y-2.5'>
        <div className='flex flex-wrap items-center gap-2'>
          <h3 className='text-primary-strong text-base font-semibold'>{contractor.name}</h3>
          {contractor.verified ? (
            <span className='text-primary inline-flex items-center gap-1 text-xs' title={t('verified')}>
              <BadgeCheck className='size-4' />
            </span>
          ) : null}
          {invited ? (
            <span className='bg-primary/10 text-primary-strong rounded-md px-2 py-0.5 text-[11px] font-medium'>
              {t('invited')}
            </span>
          ) : null}
        </div>

        <ContractorStats contractor={contractor} />

        <p
          className={cn(
            'inline-flex items-center gap-1.5 text-xs',
            contractor.acceptingProjects ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <CircleCheck className='size-3.5' />
          {contractor.acceptingProjects ? t('accepting') : t('notAccepting')}
        </p>
      </div>

      <div className='flex shrink-0 flex-col gap-2 sm:w-40'>
        <Button asChild variant='outline' size='sm' className='justify-center'>
          <Link href={contractorFirmRoute(projectId, contractor.id)}>
            <FileText className='size-4' />
            {t('viewProfile')}
          </Link>
        </Button>

        {disabled ? (
          <Button size='sm' disabled title={invited ? t('invited') : t('inviteFull', { max: MAX_INVITATIONS })}>
            <Send className='size-4' />
            {invited ? t('invited') : t('invite')}
          </Button>
        ) : (
          <Button asChild size='sm'>
            <Link href={contractorInviteRoute(projectId, contractor.id)}>
              <Send className='size-4' />
              {t('invite')}
            </Link>
          </Button>
        )}
      </div>
    </article>
  )
}
