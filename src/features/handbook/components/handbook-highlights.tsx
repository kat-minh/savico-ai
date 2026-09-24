'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, ChevronRight, CalendarDays, Tag } from 'lucide-react'
import { motion } from 'motion/react'
import { useFormatter, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { revealEase, RevealPhoto } from '@/shared/components/common'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ROUTES, handbookArticleRoute } from '@/shared/constants/routes'
import { useArticleLabels } from '../hooks/use-article-labels'
import { HOME_HANDBOOK_COUNT } from '../constants/handbook.constants'
import { useHandbookArticles } from '../hooks/use-handbook'
import { sortByNewest } from '../services/handbook.service'

/** Bài đăng trong 14 ngày gần nhất được gắn nhãn "Mới" (mục II.2, vùng 08). */
const NEW_BADGE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000

/**
 * Khối "Cẩm nang xây nhà" trên TRANG CHỦ — ba bài mới nhất.
 *
 * Khác `LatestNews` (nằm trong trang Cẩm nang, thẻ nằm ngang, đo bằng thời gian
 * đọc): ở trang chủ thẻ là ảnh trên – chữ dưới và ghi chuyên mục + ngày đăng,
 * đúng như ảnh mockup khách gửi.
 *
 * ★ Thẻ hiện lần lượt, ảnh hiện dần; rê thẻ: ảnh phóng nhẹ + phủ xanh mờ, tiêu
 * đề đổi xanh, lộ dòng "Đọc ~x phút →" trong khoảng đã chừa sẵn.
 */
export function HandbookHighlights() {
  const t = useTranslations('handbook.home')
  const { nameOf: labelName } = useArticleLabels()
  const format = useFormatter()

  const { data: articles, isPending } = useHandbookArticles()
  const latest = useMemo(() => sortByNewest(articles ?? []).slice(0, HOME_HANDBOOK_COUNT), [articles])
  // Chốt mốc "bây giờ" một lần khi mount thay vì gọi `Date.now()` ngay trong
  // JSX của mỗi lần render — nhãn "Mới" không cần cập nhật tức thời tới từng
  // mili-giây trong lúc khách đang xem trang.
  const [now] = useState(() => Date.now())

  return (
    <section className='mx-auto w-full max-w-[90rem] px-4 pt-5 pb-5 lg:px-8 lg:py-16'>
      <header className='flex flex-wrap items-start justify-between gap-x-10 gap-y-3'>
        <div className='space-y-2'>
          {/* Cùng khuôn với các khối phía trên: dưới `lg` bỏ dòng nhãn, tiêu đề LỚN là "Cẩm nang xây
              nhà" (`titleMobile`) và câu "Kiến thức thực tế…" thành mô tả nhỏ. Từ `lg` giữ nguyên. */}
          <p className='text-primary hidden text-xs font-semibold tracking-[0.16em] uppercase lg:block'>
            {t('eyebrow')}
          </p>
          <h2 className='text-2xl font-bold tracking-tight text-balance lg:text-[1.75rem]'>
            <span className='lg:hidden'>{t('titleMobile')}</span>
            <span className='hidden lg:inline'>{t('title')}</span>
          </h2>
          <p className='text-muted-foreground text-sm lg:hidden'>{t('title')}</p>
        </div>

        <Link
          href={ROUTES.HANDBOOK}
          className='text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline'
        >
          {t('viewAll')}
          <ChevronRight className='size-4 lg:hidden' />
          <ArrowRight className='hidden size-4 lg:block' />
        </Link>
      </header>

      <ul className='mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
        {isPending
          ? Array.from({ length: HOME_HANDBOOK_COUNT }, (_, index) => (
              <li key={index}>
                <Skeleton className='h-64 w-full rounded-2xl' />
              </li>
            ))
          : latest.map((article, index) => {
              const isNew = now - new Date(article.publishedAt).getTime() < NEW_BADGE_WINDOW_MS

              return (
                <motion.li
                  key={article.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: revealEase }}
                >
                  <Link
                    href={handbookArticleRoute(article.slug)}
                    className='bg-card group hover:border-primary/50 flex h-full flex-col overflow-hidden rounded-2xl border transition-colors'
                  >
                    <div className='relative'>
                      <RevealPhoto
                        className='aspect-[16/9] w-full'
                        src={article.imageUrl}
                        alt={article.title}
                        sizes='(max-width: 1024px) 50vw, 420px'
                      />
                      {/* Phủ xanh mờ khi rê — nằm ĐÈ LÊN ảnh, không thay ảnh. */}
                      <div className='bg-primary/0 group-hover:bg-primary/20 pointer-events-none absolute inset-0 transition-colors duration-300' />
                      {isNew ? (
                        <span className='bg-primary text-primary-foreground absolute top-3 left-3 rounded-md px-2 py-0.5 text-[11px] font-semibold'>
                          {t('newBadge')}
                        </span>
                      ) : null}
                    </div>
                    <span className='flex flex-1 flex-col gap-2 p-4'>
                      <span className='group-hover:text-primary-strong line-clamp-2 font-bold transition-colors'>
                        {article.title}
                      </span>
                      <span className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs'>
                        <span className='flex items-center gap-1.5'>
                          <Tag className='text-primary/70 size-3.5' />
                          {labelName(article.category)}
                        </span>
                        <span className='flex items-center gap-1.5 border-l pl-4'>
                          <CalendarDays className='text-primary/70 size-3.5' />
                          {format.dateTime(new Date(article.publishedAt), {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </span>
                      {/* Khoảng này LUÔN chiếm chỗ sẵn (chiều cao cố định
                          theo dòng chữ) — rê chuột chỉ đổi opacity, không
                          đổi chiều cao, nên thẻ không bao giờ bị giãn ra.
                          Dưới `sm` (cảm ứng, không có rê chuột) bỏ hẳn để đáy thẻ không trống,
                          giống thẻ của khối Hướng dẫn. */}
                      <span className='text-primary mt-auto pt-1 text-xs font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100 max-sm:hidden'>
                        {t('readTime', { minutes: article.readingMinutes })}
                      </span>
                    </span>
                  </Link>
                </motion.li>
              )
            })}
      </ul>
    </section>
  )
}
