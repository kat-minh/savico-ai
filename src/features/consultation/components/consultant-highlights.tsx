'use client'

import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ROUTES, consultantRoute } from '@/shared/constants/routes'
import { HOME_CONSULTANT_COUNT } from '../constants/consultation.constants'
import { useConsultants } from '../hooks/use-consultation'

/**
 * ★ Section "Tư vấn 1:1" trên trang chủ (mục III.2).
 *
 * Thẻ ở đây RÚT GỌN hơn `ConsultantCard` của trang Tư vấn: ảnh tròn, tên, một
 * dòng chuyên môn và nút đặt lịch — đúng ảnh mockup. Đánh giá, số năm kinh
 * nghiệm, ảnh công trình để dành cho trang danh sách, trang chủ không cần.
 */
export function ConsultantHighlights() {
  const t = useTranslations('consult.home')
  const { data: consultants, isPending } = useConsultants()

  return (
    <section className='mx-auto w-full max-w-[90rem] px-4 py-14 lg:px-8 lg:py-16'>
      <header className='mb-8 flex flex-wrap items-start justify-between gap-x-10 gap-y-3'>
        <div className='space-y-2'>
          <p className='text-primary text-xs font-semibold tracking-[0.16em] uppercase'>{t('eyebrow')}</p>
          <h2 className='text-2xl font-bold tracking-tight text-balance lg:text-[1.75rem]'>{t('title')}</h2>
          <p className='text-muted-foreground text-sm'>{t('subtitle')}</p>
        </div>

        <Link
          href={ROUTES.CONSULT}
          className='text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline'
        >
          {t('viewAll')}
          <ArrowRight className='size-4' />
        </Link>
      </header>

      <ul className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
        {isPending
          ? Array.from({ length: HOME_CONSULTANT_COUNT }, (_, index) => (
              <li key={index}>
                <Skeleton className='h-28 w-full rounded-2xl' />
              </li>
            ))
          : consultants?.slice(0, HOME_CONSULTANT_COUNT).map((consultant) => (
              <li key={consultant.id} className='bg-card flex items-center gap-4 rounded-2xl border p-4'>
                <Avatar className='size-18 shrink-0'>
                  <AvatarImage src={consultant.avatarUrl} alt={consultant.name} />
                  <AvatarFallback>{consultant.name.slice(0, 1)}</AvatarFallback>
                </Avatar>

                {/* Ảnh nằm ngoài cùng bên trái, CỘT PHẢI xếp dọc: tên · chuyên môn
                    · nút. Nút rộng bằng cột phải chứ không bằng cả thẻ (ảnh
                    mockup). */}
                <div className='min-w-0 flex-1 space-y-2'>
                  <div className='space-y-0.5'>
                    <p className='truncate text-sm font-bold'>{consultant.name}</p>
                    <p className='text-muted-foreground truncate text-xs'>{consultant.specialties[0]?.label}</p>
                  </div>

                  <Button asChild variant='outline' className='text-primary h-8 w-full rounded-lg text-xs'>
                    <Link href={consultantRoute(consultant.id)}>{t('book')}</Link>
                  </Button>
                </div>
              </li>
            ))}
      </ul>
    </section>
  )
}
