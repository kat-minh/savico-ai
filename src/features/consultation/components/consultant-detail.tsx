'use client'

import { useTranslations } from 'next-intl'

import { ErrorState } from '@/shared/components/common'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useAvailability, useConsultant, useConsultants } from '../hooks/use-consultation'
import { ConsultantProfile } from './consultant-profile'
import { ConsultantRail } from './consultant-rail'

interface ConsultantDetailProps {
  consultantId: string
}

/**
 * Trang hồ sơ kiến trúc sư + chọn giờ (mục VIII.2, Hình 15).
 *
 * Giữ nguyên tiêu đề của trang danh sách ở trên đầu như trong ảnh — khách vẫn
 * đang ở luồng "chọn kiến trúc sư", chỉ là đã mở một người ra xem.
 */
export function ConsultantDetail({ consultantId }: ConsultantDetailProps) {
  const t = useTranslations('consult.directory')
  const tProfile = useTranslations('consult.profile')

  const { data: consultants, isPending: listPending } = useConsultants()
  const { data: consultant, isPending, isError } = useConsultant(consultantId)
  const { data: days, isPending: daysPending } = useAvailability(consultantId)

  return (
    <div className='mx-auto w-full max-w-[80rem] space-y-6 px-4 py-10 lg:px-8'>
      <header className='space-y-2 text-center'>
        <h2 className='text-2xl font-semibold tracking-tight text-balance sm:text-3xl'>{t('title')}</h2>
        <p className='text-muted-foreground'>{t('subtitle')}</p>
      </header>

      <div className='grid gap-5 lg:grid-cols-[20rem_1fr]'>
        <ConsultantRail consultants={consultants ?? []} activeId={consultantId} isPending={listPending} />

        {isPending ? (
          <Skeleton className='h-[32rem] w-full rounded-xl' />
        ) : isError || !consultant ? (
          <ErrorState title={tProfile('notFound')} />
        ) : (
          /* `key`: đổi sang KTS khác ở cột trái phải dựng lại hồ sơ từ đầu, nếu
             không ngày/giờ đã chọn của người trước còn dính lại. */
          <ConsultantProfile key={consultant.id} consultant={consultant} days={days ?? []} isPending={daysPending} />
        )}
      </div>
    </div>
  )
}
