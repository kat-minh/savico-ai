'use client'

import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Link } from '@/i18n/navigation'
import { revealEase } from '@/shared/components/common'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { consultantRoute, ROUTES } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { HOME_CONSULTANT_COUNT } from '../constants/consultation.constants'
import { useConsultants } from '../hooks/use-consultation'
import { sortConsultants } from '../services/consultation.service'
import type { Consultant } from '../types/consultation.types'

interface ConsultantHighlightsProps {
  /**
   * Chuyên môn ưu tiên theo loại công trình của dự án dở gần nhất (mục II.2)
   * — trùng id với `BuildingType` của `features/design` nên lớp app chỉ cần
   * truyền thẳng `project.buildingType`, không cần bảng ánh xạ nào.
   */
  preferredSpecialtyId?: string
}

type BookingState = 'idle' | 'loading' | 'done'

/**
 * ★ Section "Tư vấn 1:1" trên trang chủ (mục III.2).
 *
 * Thẻ ở đây RÚT GỌN hơn `ConsultantCard` của trang Tư vấn: ảnh tròn, tên, một
 * dòng chuyên môn và nút đặt lịch — đúng ảnh mockup. Đánh giá, số năm kinh
 * nghiệm, ảnh công trình để dành cho trang danh sách, trang chủ không cần.
 *
 * ★ Thẻ hiện lần lượt, vòng viền ảnh "vẽ" 1 vòng lúc hiện; rê thẻ: nhấc + phóng
 * ảnh nhẹ, nút "Đặt lịch" đầy màu. Có dự án dở → KTS đúng chuyên môn của loại
 * công trình đó trượt lên đầu danh sách (`layout` của motion tự animate vị trí
 * khi thứ tự mảng đổi, không cần tự tính transform).
 *
 * Bấm "Đặt lịch" ở ĐÂY chỉ là xem trước nhanh: chưa chọn ngày/giờ nào cả, nên
 * đổi sang "Đã đặt lịch ✓" và khoá lại là hiệu ứng tại chỗ, không tạo lịch hẹn
 * thật — muốn đặt lịch thật phải mở hồ sơ KTS để chọn khung giờ (mục VIII.2).
 */
export function ConsultantHighlights({ preferredSpecialtyId }: ConsultantHighlightsProps) {
  const t = useTranslations('consult.home')
  const { data: consultants, isPending } = useConsultants()
  const [bookingByConsultant, setBookingByConsultant] = useState<Record<string, BookingState>>({})

  const ordered = sortConsultants(consultants ?? [], preferredSpecialtyId).slice(0, HOME_CONSULTANT_COUNT)

  const startBooking = (consultantId: string) => {
    setBookingByConsultant((current) => ({ ...current, [consultantId]: 'loading' }))
    window.setTimeout(() => {
      setBookingByConsultant((current) => ({ ...current, [consultantId]: 'done' }))
    }, 700)
  }

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
          : ordered.map((consultant, index) => (
              <ConsultantHighlightCard
                key={consultant.id}
                consultant={consultant}
                index={index}
                bookingState={bookingByConsultant[consultant.id] ?? 'idle'}
                onBook={() => startBooking(consultant.id)}
              />
            ))}
      </ul>
    </section>
  )
}

function ConsultantHighlightCard({
  consultant,
  index,
  bookingState,
  onBook
}: {
  consultant: Consultant
  index: number
  bookingState: BookingState
  onBook: () => void
}) {
  const t = useTranslations('consult.home')

  return (
    <motion.li
      layout
      layoutId={consultant.id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ layout: { duration: 0.4, ease: revealEase }, opacity: { duration: 0.5, delay: index * 0.1 } }}
      whileHover={{ y: -4 }}
      className='group/card bg-card flex items-center gap-4 rounded-2xl border p-4 transition-shadow hover:shadow-lg'
    >
      {/* Ảnh + tên dẫn sang hồ sơ KTS thật (hai liên kết riêng, cùng đích) —
          nút "Đặt lịch" bên dưới chỉ là xem trước tại chỗ (chưa chọn giờ nào)
          nên không thể lồng chung một thẻ <a> với nó. */}
      <Link href={consultantRoute(consultant.id)} className='contents'>
        {/* Rê cả thẻ (không riêng ảnh) mới phóng ảnh nhẹ — `group-hover/card`. */}
        <Avatar className='group-hover/card:scale-105 size-18 shrink-0 transition-transform duration-300'>
          <AvatarImage src={consultant.avatarUrl} alt={consultant.name} />
          <AvatarFallback>{consultant.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
      </Link>

      {/* Ảnh nằm ngoài cùng bên trái, CỘT PHẢI xếp dọc: tên · chuyên môn
          · nút. Nút rộng bằng cột phải chứ không bằng cả thẻ (ảnh
          mockup). Tên giữ màu đen cố định, không đổi màu khi rê thẻ. */}
      <div className='min-w-0 flex-1 space-y-2'>
        <Link href={consultantRoute(consultant.id)} className='block space-y-0.5'>
          <p className='truncate text-sm font-bold'>{consultant.name}</p>
          <p className='text-muted-foreground truncate text-xs'>{consultant.specialties[0]?.label}</p>
        </Link>

        {bookingState === 'idle' ? (
          <Button
            variant='outline'
            className='text-primary group-hover/card:bg-primary group-hover/card:bg-none group-hover/card:text-primary-foreground h-8 w-full rounded-lg text-xs transition-colors'
            onClick={onBook}
          >
            {t('book')}
          </Button>
        ) : (
          <Button
            disabled
            variant='outline'
            className={cn(
              'h-8 w-full rounded-lg text-xs',
              bookingState === 'loading' && 'bg-primary bg-none text-primary-foreground',
              bookingState === 'done' && 'border-primary/40 text-primary-strong bg-primary/5'
            )}
          >
            {bookingState === 'loading' ? (
              <Loader2 className='size-3.5 animate-spin' />
            ) : (
              <Check className='size-3.5' />
            )}
            {bookingState === 'loading' ? t('booking') : t('booked')}
          </Button>
        )}
      </div>
    </motion.li>
  )
}
