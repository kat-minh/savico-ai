'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Clock, Minus, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { Photo } from '@/shared/components/common'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { handbookArticleRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { useHandbookArticles, useHandbookStages } from '../hooks/use-handbook'
import { articlesOfTopic, countArticlesByTopic } from '../services/handbook.service'
import type { HandbookStageId } from '../types/handbook.types'

/**
 * Khối "Cẩm nang nền tảng" (Phần 3.1, Hình 9 và Hình 10).
 *
 * Băng giới thiệu + ba thẻ giai đoạn. Mở một giai đoạn ngay tại trang: hiện bảng
 * chủ đề kèm số bài, rồi hiện danh sách bài của chủ đề đang chọn — người dùng
 * thấy ngay độ dày của kho kiến thức mà không phải rời trang.
 */
export function FoundationBlock() {
  const t = useTranslations('handbook.foundation')

  const { data: stages, isPending } = useHandbookStages()
  const { data: articles } = useHandbookArticles()

  const [openStage, setOpenStage] = useState<HandbookStageId | null>(null)
  const [openTopic, setOpenTopic] = useState<string | null>(null)

  const counts = useMemo(() => countArticlesByTopic(articles ?? []), [articles])
  const activeStage = stages?.find((stage) => stage.id === openStage)
  const topicArticles = useMemo(
    () => (openTopic ? articlesOfTopic(articles ?? [], openTopic) : []),
    [articles, openTopic]
  )

  function toggleStage(id: HandbookStageId, firstTopicId?: string) {
    if (openStage === id) {
      setOpenStage(null)
      setOpenTopic(null)
      return
    }
    setOpenStage(id)
    setOpenTopic(firstTopicId ?? null)
  }

  return (
    <section className='border-primary/30 bg-card space-y-5 rounded-2xl border p-5'>
      <Badge variant='secondary' className='gap-1.5 uppercase'>
        <BookOpen className='size-3.5' />
        {t('eyebrow')}
      </Badge>

      {/* Băng giới thiệu: chữ bên trái, ảnh công trình bên phải (Hình 9). */}
      <div className='bg-primary/5 grid gap-4 overflow-hidden rounded-xl md:grid-cols-[1.2fr_1fr]'>
        <div className='space-y-3 p-6'>
          <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>{t('kicker')}</p>
          <h2 className='text-2xl font-semibold tracking-tight text-balance'>{t('title')}</h2>
          <p className='text-muted-foreground text-sm leading-relaxed'>{t('description')}</p>
          <Button
            onClick={() => {
              const first = stages?.[0]
              if (first) toggleStage(first.id, first.topics[0]?.id)
            }}
          >
            {t('start')}
            <ArrowRight className='size-4' />
          </Button>
        </div>
        {stages?.[0] ? (
          <Photo
            className='min-h-44 w-full'
            src={stages[0].imageUrl}
            alt={t('title')}
            sizes='(max-width: 768px) 100vw, 420px'
          />
        ) : null}
      </div>

      <h3 className='text-base font-semibold'>{t('stagesTitle')}</h3>

      {isPending ? (
        <div className='grid gap-4 lg:grid-cols-3'>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className='h-28 rounded-xl' />
          ))}
        </div>
      ) : (
        <div className='grid gap-4 lg:grid-cols-3'>
          {stages?.map((stage) => {
            const open = stage.id === openStage
            return (
              <button
                key={stage.id}
                type='button'
                onClick={() => toggleStage(stage.id, stage.topics[0]?.id)}
                aria-expanded={open}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                  open ? 'border-primary bg-primary/5' : 'hover:border-primary/40'
                )}
              >
                <Photo className='size-20 shrink-0 rounded-lg' src={stage.imageUrl} alt={stage.title} sizes='80px' />
                <span className='min-w-0 flex-1'>
                  <span className='text-muted-foreground block text-xs'>{t('stepLabel', { order: stage.order })}</span>
                  <span className='block text-base font-semibold'>{stage.title}</span>
                  <span className='text-muted-foreground line-clamp-2 block text-xs'>{stage.description}</span>
                </span>
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full',
                    open ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                  )}
                  aria-hidden
                >
                  {open ? <Minus className='size-4' /> : <Plus className='size-4' />}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {activeStage ? (
        <div className='space-y-4 rounded-xl border p-4'>
          <h3 className='text-base font-semibold'>{t('stageHeading', { stage: activeStage.title })}</h3>

          <ul className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            {activeStage.topics.map((topic) => (
              <li key={topic.id}>
                <button
                  type='button'
                  onClick={() => setOpenTopic(topic.id)}
                  aria-pressed={topic.id === openTopic}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition-colors',
                    topic.id === openTopic ? 'border-primary bg-primary/5' : 'hover:border-primary/40'
                  )}
                >
                  <span className='block text-sm font-medium'>{topic.title}</span>
                  <span className='text-muted-foreground block text-xs'>
                    {t('articleCount', { count: counts[topic.id] ?? 0 })}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {topicArticles.length > 0 ? (
            <ul className='divide-y rounded-lg border'>
              {topicArticles.map((article) => (
                <li key={article.id}>
                  <Link
                    href={handbookArticleRoute(article.slug)}
                    className='hover:bg-muted/50 flex items-center gap-3 px-4 py-3 transition-colors'
                  >
                    <span className='bg-primary size-1.5 shrink-0 rounded-full' aria-hidden />
                    <span className='min-w-0 flex-1 text-sm font-medium'>{article.title}</span>
                    <span className='text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs'>
                      <Clock className='size-3.5' />
                      {t('readingTime', { minutes: article.readingMinutes })}
                    </span>
                    <ArrowRight className='text-primary size-4 shrink-0' />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-muted-foreground text-sm'>{t('topicEmpty')}</p>
          )}
        </div>
      ) : null}
    </section>
  )
}
