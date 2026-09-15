'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
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

const LAST_VIEW_KEY = 'savico.handbook.latest-last-view'

function NewBadge({ articleId, label }: { articleId: string; label: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const key = `savico.handbook.latest-new-animated.${articleId}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')

    const animation = node.animate(
      [
        { opacity: 0, transform: 'translateY(4px) scale(0.82)' },
        { opacity: 1, transform: 'translateY(0) scale(1.07)', offset: 0.65 },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ],
      { duration: 340, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    )
    return () => animation.cancel()
  }, [articleId])

  return (
    <span ref={ref} data-latest-new-badge>
      <Badge variant='default'>{label}</Badge>
    </span>
  )
}

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
  const [newArticleIds, setNewArticleIds] = useState<Set<string>>(() => new Set())
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (latest.length === 0) return

    const frame = window.requestAnimationFrame(() => {
      const rawPrevious = localStorage.getItem(LAST_VIEW_KEY)
      const previous = rawPrevious ? Number(rawPrevious) : Number.NaN
      const nextIds = new Set<string>()

      if (Number.isFinite(previous)) {
        latest.forEach((article) => {
          const publishedAt = new Date(article.publishedAt).getTime()
          if (Number.isFinite(publishedAt) && publishedAt > previous) nextIds.add(article.id)
        })
      }

      setNewArticleIds(nextIds)
      localStorage.setItem(LAST_VIEW_KEY, String(Date.now()))
    })

    return () => window.cancelAnimationFrame(frame)
  }, [latest])

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section || isPending || latest.length === 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const title = section.querySelector<HTMLElement>('[data-latest-title]')
    const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-latest-card]'))
    if (!title || cards.length === 0) return

    title.style.opacity = '0'
    title.style.transform = 'translateY(14px)'
    cards.forEach((card) => {
      card.style.opacity = '0'
      card.style.transform = 'translateY(18px)'
      card.querySelectorAll<HTMLElement>('[data-latest-reveal]').forEach((node) => {
        node.style.opacity = '0'
        node.style.transform = 'translateY(6px)'
      })
    })

    const animations: Animation[] = []
    const remember = (animation: Animation, node: HTMLElement) => {
      animations.push(animation)
      void animation.finished
        .then(() => {
          animation.cancel()
          node.style.removeProperty('opacity')
          node.style.removeProperty('transform')
        })
        .catch(() => undefined)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()

        remember(
          title.animate(
            [
              { opacity: 0, transform: 'translateY(14px)' },
              { opacity: 1, transform: 'translateY(0)' }
            ],
            { duration: 340, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' }
          ),
          title
        )

        cards.forEach((card, cardIndex) => {
          const cardDelay = [80, 190, 290][cardIndex] ?? 80 + cardIndex * 105
          remember(
            card.animate(
              [
                { opacity: 0, transform: 'translateY(18px)' },
                { opacity: 1, transform: 'translateY(0)' }
              ],
              {
                duration: 420,
                delay: cardDelay,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'both'
              }
            ),
            card
          )

          const revealOrder = ['image', 'tag', 'title', 'time']
          const revealDelays = [70, 135, 195, 255]
          revealOrder.forEach((part, partIndex) => {
            const node = card.querySelector<HTMLElement>(`[data-latest-reveal='${part}']`)
            if (!node) return
            const isImage = part === 'image'
            remember(
              node.animate(
                isImage
                  ? [
                      { opacity: 0, transform: 'scale(1.045)' },
                      { opacity: 1, transform: 'scale(1)' }
                    ]
                  : [
                      { opacity: 0, transform: 'translateY(6px)' },
                      { opacity: 1, transform: 'translateY(0)' }
                    ],
                {
                  duration: isImage ? 500 : 280,
                  delay: cardDelay + (revealDelays[partIndex] ?? 255),
                  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  fill: 'both'
                }
              ),
              node
            )
          })
        })
      },
      { threshold: 0.18 }
    )

    observer.observe(section)
    return () => {
      observer.disconnect()
      animations.forEach((animation) => animation.cancel())
      title.style.removeProperty('opacity')
      title.style.removeProperty('transform')
      cards.forEach((card) => {
        card.style.removeProperty('opacity')
        card.style.removeProperty('transform')
        card.querySelectorAll<HTMLElement>('[data-latest-reveal]').forEach((node) => {
          node.style.removeProperty('opacity')
          node.style.removeProperty('transform')
        })
      })
    }
  }, [isPending, latest])

  function handleSeeAll(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    const target = document.querySelector<HTMLElement>('#all-articles')
    if (!target) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })

    let attempts = 0
    const flashWhenArrived = () => {
      const search = document.querySelector<HTMLInputElement>('[data-article-search]')
      const rect = target.getBoundingClientRect()
      const closeEnough = Math.abs(rect.top) < 160 || attempts >= 80 || reduced
      if (closeEnough) {
        if (!search) return
        search.dataset.flash = 'true'
        if (reduced) {
          window.setTimeout(() => delete search.dataset.flash, 240)
        } else {
          search.addEventListener('animationend', () => delete search.dataset.flash, { once: true })
        }
        return
      }
      attempts += 1
      window.requestAnimationFrame(flashWhenArrived)
    }
    window.requestAnimationFrame(flashWhenArrived)
  }

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
    <section ref={sectionRef} data-latest-news className='space-y-4'>
      <div className='flex items-center justify-between gap-3'>
        <h2 data-latest-title className='text-xl font-semibold tracking-tight'>
          {t('title')}
        </h2>
        <Link
          data-latest-see-all
          data-stage-guide-link
          href='#all-articles'
          onClick={handleSeeAll}
          className='text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:font-bold focus-visible:font-bold'
        >
          <span className='relative grid'>
            <span aria-hidden className='invisible col-start-1 row-start-1 font-bold'>
              {t('seeAll')}
            </span>
            <span className='col-start-1 row-start-1'>{t('seeAll')}</span>
            <span
              data-stage-guide-underline
              aria-hidden
              className='bg-primary absolute right-0 -bottom-0.5 left-0 h-px motion-reduce:transition-none'
            />
          </span>
          <ArrowRight
            data-step-link-arrow
            className='size-4 transition-transform duration-200 motion-reduce:transition-none'
          />
        </Link>
      </div>

      <ul
        data-latest-carousel
        className='scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible md:pb-0'
      >
        {latest.map((article) => (
          <li key={article.id} className='min-w-[85%] snap-start sm:min-w-[60%] md:min-w-0'>
            <Link
              data-latest-card
              href={handbookArticleRoute(article.slug)}
              className='group bg-card hover:border-primary/50 flex h-full overflow-hidden rounded-xl border transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:shadow-md'
            >
              <span data-latest-reveal='image' className='block w-44 shrink-0 overflow-hidden'>
                <Photo
                  className='latest-news-image-motion h-full w-full transition-transform duration-[450ms] group-hover:scale-[1.035]'
                  src={article.imageUrl}
                  alt={article.title}
                  sizes='176px'
                />
              </span>
              <span className='min-w-0 flex-1 space-y-1.5 p-3'>
                <span data-latest-reveal='tag' className='flex flex-wrap items-center gap-1.5 group-hover:font-bold'>
                  <Badge variant='secondary'>{t(`categories.${article.category}`)}</Badge>
                  {newArticleIds.has(article.id) ? <NewBadge articleId={article.id} label={t('new')} /> : null}
                </span>
                <span
                  data-latest-reveal='title'
                  className='line-clamp-2 block text-sm font-semibold transition-colors duration-200 group-hover:text-primary'
                >
                  {article.title}
                </span>
                <span data-latest-reveal='time' className='text-muted-foreground flex items-center gap-1.5 text-xs'>
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
