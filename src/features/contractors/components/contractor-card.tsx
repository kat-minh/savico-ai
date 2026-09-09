'use client'

import { CalendarCheck, CircleCheck, Clock, FileText, MapPin, Map as MapIcon, Send, Star } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { contractorFirmRoute, contractorInviteRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { formatNumber } from '@/shared/utils'
import { MAX_INVITATIONS } from '../constants/contractors.constants'
import type { Contractor } from '../types/contractor.types'
import { ContractorLogo } from './contractor-logo'

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
 * Bố cục theo bản thiết kế S12: ô tick "So sánh" và ô logo lớn nằm NGOÀI cùng
 * bên trái, giữa là tên nhà thầu (màu xanh, cỡ lớn) trên một LƯỚI chỉ số có vạch
 * ngăn dọc, phải là hai nút xếp chồng.
 *
 * Mỗi ô chỉ số là hai dòng — giá trị ở trên, nhãn nhỏ ở dưới ("18 dự án" /
 * "tương tự") — chứ không phải một dãy chip một dòng như bản trước: cùng một bộ
 * số nhưng đọc lướt nhanh hơn hẳn khi so ba nhà thầu chồng lên nhau.
 *
 * Nút "Mời báo giá" khóa khi dự án đã đủ 3 lời mời (R1) — khóa chứ không ẩn, để
 * người dùng hiểu vì sao không bấm được.
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
  const locale = useLocale() as Locale

  const disabled = invited || inviteLocked

  /** Bốn ô hàng trên: đánh giá · dự án tương tự · khoảng cách · phạm vi phục vụ. */
  const facts = [
    {
      key: 'rating',
      icon: Star,
      iconClass: 'text-warning fill-current',
      value: `${formatNumber(contractor.rating, locale, { minimumFractionDigits: 1 })}/5`,
      hint: t('reviewCount', { count: contractor.reviewCount })
    },
    {
      key: 'similar',
      icon: CalendarCheck,
      value: t('similarShort', { count: contractor.similarProjects }),
      hint: t('similarSuffix')
    },
    {
      key: 'distance',
      icon: MapPin,
      value: t('distanceShort', { km: formatNumber(contractor.distanceKm, locale, { minimumFractionDigits: 1 }) }),
      hint: t('distanceSuffix')
    },
    {
      key: 'areas',
      icon: MapIcon,
      value: t('serviceAreas'),
      hint: contractor.serviceAreas.slice(0, 3).join(', ')
    }
  ]

  return (
    <article
      className={cn(
        'bg-card flex flex-col gap-4 rounded-2xl border p-4 transition-colors sm:flex-row sm:items-start sm:p-5',
        compared ? 'border-primary/60' : 'hover:border-primary/40'
      )}
    >
      <div className='flex items-center gap-4 sm:items-start'>
        <label className='text-muted-foreground flex cursor-pointer flex-col items-center gap-1.5 text-[11px]'>
          <Checkbox
            checked={compared}
            onCheckedChange={() => onToggleCompare(contractor.id)}
            aria-label={`${tMatches('compareCheckbox')} ${contractor.name}`}
          />
          <span>{tMatches('compareCheckbox')}</span>
        </label>

        {/* Ô logo lớn hơn hẳn bản trước — trong thiết kế nó là mốc nhận diện
            chính khi khách lướt qua ba nhà thầu. */}
        <ContractorLogo contractor={contractor} className='size-20 rounded-xl' />
      </div>

      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <h3 className='text-primary-strong text-lg font-bold'>{contractor.name}</h3>
          {invited ? (
            <span className='bg-primary/10 text-primary-strong rounded-md px-2 py-0.5 text-[11px] font-medium'>
              {t('invited')}
            </span>
          ) : null}
        </div>

        {/* Vạch ngăn dọc giữa các ô, vạch ngang giữa hai hàng — `divide-*` lo cả
            hai, khỏi phải tự đặt border cho từng ô. */}
        <div className='divide-border mt-3 grid divide-y sm:grid-cols-2 lg:grid-cols-4'>
          <div className='divide-border grid divide-y sm:col-span-2 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:col-span-4 lg:grid-cols-4'>
            {facts.map((fact) => (
              <Fact key={fact.key} icon={fact.icon} iconClass={fact.iconClass} value={fact.value} hint={fact.hint} />
            ))}
          </div>

          <div className='divide-border grid divide-y sm:col-span-2 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:col-span-4'>
            <Fact
              icon={Clock}
              value={t('surveyWithin', { hours: contractor.surveyWithinHours })}
              hint={t('surveyEarly')}
            />
            <Fact
              icon={CircleCheck}
              value={contractor.acceptingProjects ? t('accepting') : t('notAccepting')}
              hint={t('readyToStart')}
            />
          </div>
        </div>
      </div>

      {/* Hai nút canh GIỮA theo chiều cao thẻ: khối chỉ số bên trái cao hai
          hàng nên để `items-start` thì cặp nút trôi hẳn lên đỉnh, nhìn lệch. */}
      <div className='flex shrink-0 flex-col gap-2.5 sm:w-44 sm:self-center'>
        <Button asChild variant='outline' className='justify-center'>
          <Link href={contractorFirmRoute(projectId, contractor.id)}>
            <FileText className='size-4' />
            {t('viewProfile')}
          </Link>
        </Button>

        {disabled ? (
          <Button disabled title={invited ? t('invited') : t('inviteFull', { max: MAX_INVITATIONS })}>
            <Send className='size-4' />
            {invited ? t('invited') : t('invite')}
          </Button>
        ) : (
          <Button asChild>
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

/** Một ô chỉ số: icon + giá trị ở dòng trên, nhãn nhỏ ở dòng dưới. */
function Fact({
  icon: Icon,
  iconClass,
  value,
  hint
}: {
  icon: typeof Star
  iconClass?: string
  value: string
  hint: string
}) {
  return (
    // Cột chỉ số hẹp (4 ô trên một hàng) nên chữ phải nhỏ lại, và dòng nhãn
    // được XUỐNG DÒNG tối đa 2 dòng thay vì `truncate` — "TP. Buôn Ma Thuột,
    // Cư M'gar" mà cắt cụt thì mất luôn thông tin phục vụ ở đâu.
    <div className='min-w-0 px-2.5 py-2 first:pl-0'>
      <p className='flex items-center gap-1.5 text-[13px] leading-snug font-semibold'>
        <Icon aria-hidden className={cn('size-3.5 shrink-0', iconClass ?? 'text-primary')} />
        <span className='truncate'>{value}</span>
      </p>
      <p className='text-muted-foreground mt-0.5 line-clamp-2 pl-5 text-[11px] leading-snug text-pretty'>{hint}</p>
    </div>
  )
}
