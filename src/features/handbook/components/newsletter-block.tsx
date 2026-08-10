'use client'

import { useMemo } from 'react'
import { ArrowRight, Clock } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { Photo } from '@/shared/components/common'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { handbookArticleRoute } from '@/shared/constants/routes'
import { useHandbookArticles } from '../hooks/use-handbook'
import { featuredArticles, sortByNewest } from '../services/handbook.service'
import type { HandbookArticle } from '../types/handbook.types'

/**
 * "Bản tin SAVICO" (Phần 3.2, Hình 11).
 *
 * Bài do đội nội dung chọn đẩy lên: một bài nổi bật lớn, ba bài phụ đánh số và
 * cột bài liên quan bên phải. Thứ tự lấy từ `featuredRank` chứ không phải theo
 * ngày — đây là khối biên tập, không phải dòng thời gian.
 */
export function NewsletterBlock() {
  const t = useTranslations('handbook.newsletter')
  const format = useFormatter()

  const { data: articles, isPending } = useHandbookArticles()
  const featured = useMemo(() => featuredArticles(articles ?? []), [articles])
  const related = useMemo(
    () => sortByNewest(articles ?? []).filter((article) => !featured.includes(article)),
    [articles, featured]
  )

  if (isPending) return <Skeleton className='h-96 rounded-2xl' />
  if (featured.length === 0) return null

  const [lead, ...supporting] = featured

  return (
    <section className='border-primary/30 bg-card rounded-2xl border p-5'>
      <header className='grid gap-2 border-b pb-3 lg:grid-cols-3 lg:items-center'>
        <h2 className='text-xl font-semibold tracking-tight uppercase'>{t('title')}</h2>
        {lead ? (
          <p className='text-muted-foreground text-sm lg:text-center'>
            {format.dateTime(new Date(lead.publishedAt), { dateStyle: 'full' })}
          </p>
        ) : (
          <span />
        )}
        <p className='text-muted-foreground text-sm lg:text-right'>{t('topics')}</p>
      </header>

      <div className='grid gap-6 pt-5 lg:grid-cols-[1.6fr_1fr]'>
        <div className='space-y-5'>
          <h3 className='border-primary inline-block border-b-2 pb-1 text-lg font-semibold'>{t('featured')}</h3>

          {lead ? (
            <article className='grid gap-4 sm:grid-cols-2'>
              <Photo
                className='aspect-4/3 w-full rounded-xl'
                src={lead.imageUrl}
                alt={lead.title}
                sizes='(max-width: 640px) 100vw, 380px'
              />
              <div className='space-y-2'>
                <div className='flex items-center justify-between gap-2'>
                  <Badge variant='secondary'>{t(`categories.${lead.category}`)}</Badge>
                  <span className='text-primary/50 text-3xl font-bold'>01</span>
                </div>
                <Link href={handbookArticleRoute(lead.slug)} className='block hover:underline'>
                  <h4 className='text-xl leading-snug font-semibold text-balance'>{lead.title}</h4>
                </Link>
                <p className='text-muted-foreground text-sm leading-relaxed'>{lead.excerpt}</p>
                <p className='text-muted-foreground flex items-center gap-2 text-xs'>
                  {format.dateTime(new Date(lead.publishedAt), { dateStyle: 'short' })}
                  <span aria-hidden>·</span>
                  <Clock className='size-3.5' />
                  {t('readingTime', { minutes: lead.readingMinutes })}
                </p>
              </div>
            </article>
          ) : null}

          <ul className='grid gap-3 sm:grid-cols-3'>
            {supporting.map((article, index) => (
              <li key={article.id}>
                <Link
                  href={handbookArticleRoute(article.slug)}
                  className='hover:border-primary/50 flex h-full gap-2 rounded-xl border p-2.5 transition-colors'
                >
                  <span className='text-primary/40 text-xl leading-none font-bold'>
                    {String(index + 2).padStart(2, '0')}
                  </span>
                  <Photo
                    className='size-14 shrink-0 rounded-lg'
                    src={article.imageUrl}
                    alt={article.title}
                    sizes='56px'
                  />
                  <span className='min-w-0 space-y-1'>
                    <span className='line-clamp-3 block text-sm font-medium'>{article.title}</span>
                    <span className='text-muted-foreground flex items-center gap-1 text-xs'>
                      <Clock className='size-3' />
                      {t('readingTime', { minutes: article.readingMinutes })}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className='space-y-4 lg:border-l lg:pl-6'>
          <h3 className='border-primary inline-block border-b-2 pb-1 text-lg font-semibold'>{t('related')}</h3>
          <ul className='divide-y'>
            {related.slice(0, 4).map((article) => (
              <li key={article.id} className='py-3 first:pt-0'>
                <RelatedRow article={article} />
              </li>
            ))}
          </ul>
          <Link
            href='#all-articles'
            className='text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline'
          >
            {t('seeAllRelated')}
            <ArrowRight className='size-4' />
          </Link>
        </div>
      </div>
    </section>
  )
}

function RelatedRow({ article }: { article: HandbookArticle }) {
  const t = useTranslations('handbook.newsletter')

  return (
    <Link href={handbookArticleRoute(article.slug)} className='flex gap-3 hover:underline'>
      <Photo className='size-16 shrink-0 rounded-lg' src={article.imageUrl} alt={article.title} sizes='64px' />
      <span className='min-w-0 space-y-1'>
        <span className='line-clamp-2 block text-sm font-medium'>{article.title}</span>
        <span className='block text-xs'>
          <span className='text-primary'>{t(`categories.${article.category}`)}</span>
          <span className='text-muted-foreground'> · {t('readingTime', { minutes: article.readingMinutes })}</span>
        </span>
      </span>
    </Link>
  )
}
