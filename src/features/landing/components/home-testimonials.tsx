'use client'

import { Star } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { HOME_TESTIMONIALS } from '../constants/landing.constants'

/** Năm sao vàng đặc trên đầu mỗi thẻ đánh giá. */
const STARS = [0, 1, 2, 3, 4]

/**
 * Dải "Khách hàng nói về SAVICO" — ba đánh giá ghim ở trang chủ.
 *
 * Nội dung là đánh giá MẪU nằm trong i18n, chờ khách gửi đánh giá thật; ảnh đại
 * diện để trống (chữ cái đầu) chứ không mượn ảnh chân dung người lạ gắn vào một
 * lời khen chưa có thật.
 */
export function HomeTestimonials() {
  const t = useTranslations('landing.testimonials')

  return (
    <section className='mx-auto w-full max-w-[90rem] px-4 py-10 lg:px-8 lg:py-12'>
      <p className='text-primary text-xs font-semibold tracking-[0.16em] uppercase'>{t('label')}</p>

      <ul className='mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
        {HOME_TESTIMONIALS.map((person) => (
          <li key={person} className='bg-card flex flex-col gap-3 rounded-2xl border p-5'>
            <span className='flex gap-0.5'>
              {STARS.map((star) => (
                <Star key={star} className='fill-warning text-warning size-3.5' />
              ))}
            </span>

            <blockquote className='text-sm leading-relaxed text-pretty'>{t(`items.${person}.quote`)}</blockquote>

            <div className='mt-auto flex items-center gap-3 pt-1'>
              <Avatar className='size-9 shrink-0'>
                <AvatarFallback>{t(`items.${person}.name`).slice(0, 1)}</AvatarFallback>
              </Avatar>
              <span className='flex min-w-0 flex-col leading-tight'>
                <span className='truncate text-sm font-semibold'>{t(`items.${person}.name`)}</span>
                <span className='text-muted-foreground truncate text-xs'>{t(`items.${person}.meta`)}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
