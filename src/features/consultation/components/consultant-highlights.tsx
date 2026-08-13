'use client'

import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ROUTES } from '@/shared/constants/routes'
import { HOME_CONSULTANT_COUNT } from '../constants/consultation.constants'
import { useConsultants } from '../hooks/use-consultation'
import { ConsultantCard } from './consultant-card'

/**
 * ★ Section "Tư vấn 1:1" trên trang chủ (mục III.2 — yêu cầu mới).
 *
 * Tiêu đề + dòng mời đặt lịch, 4 thẻ KTS ghim và nút mở trang Tư vấn 1:1.
 * Thẻ ghim do admin chọn (mục X, #1); tạm lấy 4 người đầu danh sách.
 */
export function ConsultantHighlights() {
  const t = useTranslations('consult.home')
  const { data: consultants, isPending } = useConsultants()

  return (
    <section className='mx-auto w-full max-w-[90rem] px-4 py-16 lg:px-8'>
      <header className='mb-8 space-y-2 text-center'>
        <h2 className='text-2xl font-semibold tracking-tight text-balance sm:text-3xl'>{t('title')}</h2>
        <p className='text-muted-foreground'>{t('subtitle')}</p>
      </header>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {isPending
          ? Array.from({ length: HOME_CONSULTANT_COUNT }, (_, i) => (
              <Skeleton key={i} className='h-52 w-full rounded-xl' />
            ))
          : consultants
              ?.slice(0, HOME_CONSULTANT_COUNT)
              .map((consultant) => <ConsultantCard key={consultant.id} consultant={consultant} />)}
      </div>

      <div className='mt-8 flex justify-center'>
        <Button asChild size='lg'>
          <Link href={ROUTES.CONSULT}>
            {t('cta')}
            <ArrowRight className='size-4' />
          </Link>
        </Button>
      </div>
    </section>
  )
}
