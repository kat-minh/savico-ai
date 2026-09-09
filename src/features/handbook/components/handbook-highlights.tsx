'use client'

import { useMemo } from 'react'
import { ArrowRight, CalendarDays, Tag } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { Photo } from '@/shared/components/common'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ROUTES, handbookArticleRoute } from '@/shared/constants/routes'
import { HOME_HANDBOOK_COUNT } from '../constants/handbook.constants'
import { useHandbookArticles } from '../hooks/use-handbook'
import { sortByNewest } from '../services/handbook.service'

/**
 * Khối "Cẩm nang xây nhà" trên TRANG CHỦ — ba bài mới nhất.
 *
 * Khác `LatestNews` (nằm trong trang Cẩm nang, thẻ nằm ngang, đo bằng thời gian
 * đọc): ở trang chủ thẻ là ảnh trên – chữ dưới và ghi chuyên mục + ngày đăng,
 * đúng như ảnh mockup khách gửi.
 */
export function HandbookHighlights() {
  const t = useTranslations('handbook.home')
  const tCategory = useTranslations('handbook.latest.categories')
  const format = useFormatter()

  const { data: articles, isPending } = useHandbookArticles()
  const latest = useMemo(() => sortByNewest(articles ?? []).slice(0, HOME_HANDBOOK_COUNT), [articles])

  return (
    <section className='mx-auto w-full max-w-[90rem] px-4 py-14 lg:px-8 lg:py-16'>
      <header className='flex flex-wrap items-start justify-between gap-x-10 gap-y-3'>
        <div className='space-y-2'>
          <p className='text-primary text-xs font-semibold tracking-[0.16em] uppercase'>{t('eyebrow')}</p>
          <h2 className='text-2xl font-bold tracking-tight text-balance lg:text-[1.75rem]'>{t('title')}</h2>
        </div>

        <Link
          href={ROUTES.HANDBOOK}
          className='text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline'
        >
          {t('viewAll')}
          <ArrowRight className='size-4' />
        </Link>
      </header>

      <ul className='mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
        {isPending
          ? Array.from({ length: HOME_HANDBOOK_COUNT }, (_, index) => (
              <li key={index}>
                <Skeleton className='h-64 w-full rounded-2xl' />
              </li>
            ))
          : latest.map((article) => (
              <li key={article.id}>
                <Link
                  href={handbookArticleRoute(article.slug)}
                  className='bg-card hover:border-primary/50 flex h-full flex-col overflow-hidden rounded-2xl border transition-colors'
                >
                  <Photo
                    className='aspect-[16/9] w-full'
                    src={article.imageUrl}
                    alt={article.title}
                    sizes='(max-width: 1024px) 50vw, 420px'
                  />
                  <span className='flex flex-1 flex-col gap-2 p-4'>
                    <span className='line-clamp-2 font-bold'>{article.title}</span>
                    <span className='text-muted-foreground mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs'>
                      <span className='flex items-center gap-1.5'>
                        <Tag className='text-primary/70 size-3.5' />
                        {tCategory(article.category)}
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
                  </span>
                </Link>
              </li>
            ))}
      </ul>
    </section>
  )
}
