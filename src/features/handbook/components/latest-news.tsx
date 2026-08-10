'use client'

import { useMemo } from 'react'
import { ArrowRight, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { Photo } from '@/shared/components/common'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { handbookArticleRoute } from '@/shared/constants/routes'
import { LATEST_NEWS_COUNT } from '../constants/handbook.constants'
import { useHandbookArticles } from '../hooks/use-handbook'
import { sortByNewest } from '../services/handbook.service'

/**
 * Khối "Tin tức mới nhất" khép lại phần cẩm nang nền tảng (Phần 3.1: "Cuối
 * trang là khối tin tức mới nhất", Hình 9 và Hình 10).
 *
 * Khác Bản tin ở chỗ đây là dòng thời gian thuần — lấy bài mới nhất theo ngày,
 * không phụ thuộc đội nội dung chọn bài như `featuredRank`.
 */
export function LatestNews() {
  const t = useTranslations('handbook.latest')

  const { data: articles, isPending } = useHandbookArticles()
  const latest = useMemo(() => sortByNewest(articles ?? []).slice(0, LATEST_NEWS_COUNT), [articles])

  if (isPending) {
    return (
      <section className='space-y-4'>
        <Skeleton className='h-7 w-48' />
        <div className='grid gap-4 md:grid-cols-3'>
          {Array.from({ length: LATEST_NEWS_COUNT }).map((_, index) => (
            <Skeleton key={index} className='h-24 rounded-xl' />
          ))}
        </div>
      </section>
    )
  }

  if (latest.length === 0) return null

  return (
    <section className='space-y-4'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-xl font-semibold tracking-tight'>{t('title')}</h2>
        <Link
          href='#all-articles'
          className='text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline'
        >
          {t('seeAll')}
          <ArrowRight className='size-4' />
        </Link>
      </div>

      <ul className='grid gap-4 md:grid-cols-3'>
        {latest.map((article) => (
          <li key={article.id}>
            <Link
              href={handbookArticleRoute(article.slug)}
              className='bg-card hover:border-primary/50 flex h-full overflow-hidden rounded-xl border transition-colors'
            >
              <Photo className='w-44 shrink-0' src={article.imageUrl} alt={article.title} sizes='176px' />
              <span className='min-w-0 flex-1 space-y-1.5 p-3'>
                <Badge variant='secondary'>{t(`categories.${article.category}`)}</Badge>
                <span className='line-clamp-2 block text-sm font-semibold'>{article.title}</span>
                <span className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                  <Clock className='size-3.5' />
                  {t('readingTime', { minutes: article.readingMinutes })}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
