'use client'

import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { revealEase } from '@/shared/components/common'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { useMediaQuery, useScrollSnapIndex } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'
import { HOME_TESTIMONIALS, type HomeTestimonial } from '../constants/landing.constants' ////cmt

/** Năm sao vàng đặc trên đầu mỗi thẻ đánh giá. */ ///test
const STARS = [0, 1, 2, 3, 4]

/** Trên 3 đánh giá thì desktop mới cần mũi tên lật trang (mục II.2, vùng 12). */
const PAGE_SIZE = 3

/**
 * Dải "Khách hàng nói về SAVICO" — ba đánh giá ghim ở trang chủ.
 *
 * Nội dung là đánh giá MẪU nằm trong i18n, chờ khách gửi đánh giá thật; ảnh đại
 * diện để trống (chữ cái đầu) chứ không mượn ảnh chân dung người lạ gắn vào một
 * lời khen chưa có thật.
 *
 * ★ Thẻ hiện lần lượt; trong thẻ 5 sao sáng lần lượt → trích dẫn → tên. Rê
 * thẻ: nhấc + vạch xanh mép trái. Nhiều hơn 3 đánh giá: desktop có mũi tên lật
 * (không tự xoay); mobile luôn vuốt ngang có chấm chỉ vị trí.
 */
export function HomeTestimonials() {
  const t = useTranslations('landing.testimonials')
  const [page, setPage] = useState(0)
  const { ref: trackRef, active, scrollTo } = useScrollSnapIndex<HTMLUListElement>()

  const pageCount = Math.ceil(HOME_TESTIMONIALS.length / PAGE_SIZE)
  const pageItems = HOME_TESTIMONIALS.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <section className='mx-auto w-full max-w-[90rem] px-4 pt-5 pb-10 lg:px-8 lg:py-12'>
      <div className='flex items-center justify-between gap-4'>
        {/* Dưới `lg` dải này mở bằng tiêu đề LỚN như các khối phía trên (`titleMobile`), không còn
            là dòng nhãn nhỏ. Từ `lg` giữ nguyên nhãn. */}
        <p className='text-primary hidden text-xs font-semibold tracking-[0.16em] uppercase lg:block'>{t('label')}</p>
        <h2 className='text-2xl font-bold tracking-tight text-balance lg:hidden'>{t('titleMobile')}</h2>

        {pageCount > 1 ? (
          <div className='hidden items-center gap-2 lg:flex'>
            <button
              type='button'
              aria-label='Previous'
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className='hover:bg-accent flex size-8 items-center justify-center rounded-full border disabled:opacity-40'
            >
              <ChevronLeft className='size-4' />
            </button>
            <button
              type='button'
              aria-label='Next'
              disabled={page === pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className='hover:bg-accent flex size-8 items-center justify-center rounded-full border disabled:opacity-40'
            >
              <ChevronRight className='size-4' />
            </button>
          </div>
        ) : null}
      </div>

      {/* Mũi tên (khi có) và chấm mobile đều điều khiển CÙNG một cửa sổ
          `pageItems` — quá 3 đánh giá thì cả hai tầng cùng đổi trang, thay vì
          giữ hai nguồn dữ liệu khác nhau cho hai kích cỡ màn hình. */}
      <ul
        ref={trackRef}
        key={page}
        className='mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto overflow-y-hidden pb-1 lg:mt-4 lg:grid lg:grid-cols-3 lg:overflow-visible'
      >
        {pageItems.map((person, index) => (
          <TestimonialCard key={person} person={person} index={index} />
        ))}
      </ul>

      {pageItems.length > 1 ? (
        <div className='mt-4 flex items-center justify-center gap-2 lg:hidden'>
          {pageItems.map((person, index) => (
            <button
              key={person}
              type='button'
              aria-label={person}
              onClick={() => scrollTo(index)}
              className={cn('size-1.5 rounded-full transition-colors', index === active ? 'bg-primary' : 'bg-border')}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}

function TestimonialCard({ person, index }: { person: HomeTestimonial; index: number }) {
  const t = useTranslations('landing.testimonials')
  // Mobile cuộn ngang: thẻ thứ 2 chỉ LÓ một mép nên các phần tử bên trong (thẻ, sao, lời trích)
  // không bao giờ đạt 30–60% diện tích → kẹt ở opacity 0 ngay lần tải đầu, tới khi vuốt mới hiện.
  // `some` = chỉ cần thấy 1 pixel là hiện.
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const amount = (desktop: number) => (isMobile ? 'some' : desktop)

  return (
    <motion.li
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: amount(0.3) }}
      transition={{ duration: 0.65, delay: index * 0.12, ease: revealEase }}
      whileHover={{ y: -2, transition: { duration: 0.5, ease: revealEase } }}
      className='bg-card group relative w-[85%] shrink-0 snap-start overflow-hidden rounded-2xl border p-5 pl-6 shadow-none transition-shadow hover:shadow-lg lg:w-auto lg:shrink'
    >
      {/* Vạch xanh mép trái — hiện khi rê. */}
      <span className='bg-primary absolute inset-y-0 left-0 w-0 transition-[width] duration-300 group-hover:w-1' />

      <div className='flex h-full flex-col gap-3'>
        <span className='flex gap-0.5'>
          {STARS.map((star) => (
            <motion.span
              key={star}
              initial={{ opacity: 0, scale: 0.4 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: amount(0.6) }}
              transition={{ duration: 0.25, delay: index * 0.1 + star * 0.08 }}
            >
              <Star className='fill-warning text-warning size-3.5' />
            </motion.span>
          ))}
        </span>

        <motion.blockquote
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: amount(0.4) }}
          transition={{ duration: 0.4, delay: index * 0.1 + 0.5 }}
          className='text-sm leading-relaxed text-pretty'
        >
          {t(`items.${person}.quote`)}
        </motion.blockquote>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: amount(0.4) }}
          transition={{ duration: 0.4, delay: index * 0.1 + 0.65 }}
          className='mt-auto flex items-center gap-3 pt-1'
        >
          <Avatar className='size-9 shrink-0'>
            <AvatarFallback>{t(`items.${person}.name`).slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className='flex min-w-0 flex-col leading-tight'>
            <span className='truncate text-sm font-semibold'>{t(`items.${person}.name`)}</span>
            <span className='text-muted-foreground truncate text-xs'>{t(`items.${person}.meta`)}</span>
          </span>
        </motion.div>
      </div>
    </motion.li>
  )
}
