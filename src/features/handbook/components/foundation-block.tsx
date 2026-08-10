'use client'

import { useMemo, useState } from 'react'
import {
  Anchor,
  ArrowRight,
  Blocks,
  BookOpenCheck,
  BrickWall,
  Brush,
  ClipboardCheck,
  Clock,
  DoorOpen,
  Footprints,
  Grid2x2,
  Hammer,
  Home,
  Layers,
  Lightbulb,
  Minus,
  PencilRuler,
  PlugZap,
  Plus,
  ShowerHead,
  Sofa,
  Wallet
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { Photo } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { handbookArticleRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { useHandbookArticles, useHandbookStages } from '../hooks/use-handbook'
import { articlesOfTopic, countArticlesByTopic } from '../services/handbook.service'
import type { HandbookStageId } from '../types/handbook.types'

/** Biểu tượng tròn của từng giai đoạn trên thẻ (Hình 9). */
const STAGE_ICON: Record<HandbookStageId, typeof Blocks> = {
  structure: Blocks,
  finishing: Brush,
  interior: Sofa
}

/**
 * Biểu tượng của từng chủ đề trong bảng chủ đề (Hình 10). Chủ đề nào chưa có
 * biểu tượng riêng thì dùng `Layers` — bảng vẫn đều mắt.
 */
const TOPIC_ICON: Record<string, typeof Blocks> = {
  foundation: Layers,
  piling: Anchor,
  frame: Blocks,
  masonry: BrickWall,
  roofing: Home,
  stairs: Footprints,
  mep: PlugZap,
  'structure-handover': ClipboardCheck,
  tiling: Grid2x2,
  painting: Brush,
  doors: DoorOpen,
  sanitary: ShowerHead,
  lighting: Lightbulb,
  'finishing-handover': ClipboardCheck,
  'interior-design': PencilRuler,
  joinery: Hammer,
  'loose-furniture': Sofa,
  'interior-budget': Wallet
}

/** Biểu tượng của một chủ đề, cỡ đồng nhất trong bảng chủ đề. */
function TopicIcon({ topicId }: { topicId: string }) {
  const Icon = TOPIC_ICON[topicId] ?? Layers
  return <Icon className='size-4' />
}

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
    <section className='border-primary/40 bg-card space-y-5 rounded-2xl border p-5'>
      {/* Hình 9: nhãn chữ xanh in hoa ở góc trên, không phải chip có nền. */}
      <p className='text-primary text-sm font-bold tracking-wide uppercase'>{t('eyebrow')}</p>

      {/* Băng giới thiệu ba phần: minh họa · chữ · ảnh công trình (Hình 9). */}
      <div className='bg-primary/5 grid items-center gap-4 overflow-hidden rounded-xl md:grid-cols-[auto_1fr] lg:grid-cols-[auto_1.1fr_1fr]'>
        <div className='flex justify-center p-6 pr-0 md:pl-8'>
          <span className='bg-primary/15 text-primary flex size-32 items-center justify-center rounded-full'>
            <BookOpenCheck className='size-16' strokeWidth={1.5} />
          </span>
        </div>

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
            className='hidden h-full min-h-56 w-full lg:block'
            src={stages[0].imageUrl}
            alt={t('title')}
            sizes='(max-width: 1024px) 100vw, 520px'
          />
        ) : null}
      </div>

      <h3 className='text-base font-semibold'>{t('stagesTitle')}</h3>

      {isPending ? (
        <div className='grid gap-4 lg:grid-cols-3'>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className='h-36 rounded-xl' />
          ))}
        </div>
      ) : (
        <div className='grid gap-4 lg:grid-cols-3'>
          {stages?.map((stage) => {
            const open = stage.id === openStage
            const Icon = STAGE_ICON[stage.id]
            return (
              <article
                key={stage.id}
                className={cn(
                  'relative flex overflow-hidden rounded-xl border transition-colors',
                  open ? 'border-primary bg-primary/5' : 'hover:border-primary/40'
                )}
              >
                <Photo className='w-40 shrink-0' src={stage.imageUrl} alt={stage.title} sizes='160px' />

                <div className='flex min-w-0 flex-1 items-start gap-3 p-3 pr-12'>
                  <span className='bg-primary/10 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full'>
                    <Icon className='size-5' />
                  </span>
                  <div className='min-w-0 space-y-1'>
                    <p className='text-muted-foreground text-xs'>{t('stepLabel', { order: stage.order })}</p>
                    <h4 className='text-lg leading-tight font-semibold'>{stage.title}</h4>
                    <p className='text-muted-foreground line-clamp-2 text-xs leading-relaxed'>{stage.description}</p>
                    {/* Hình 9: mỗi thẻ có liên kết "Xem cẩm nang →" ở dưới cùng. */}
                    <button
                      type='button'
                      onClick={() => toggleStage(stage.id, stage.topics[0]?.id)}
                      className='text-primary inline-flex items-center gap-1.5 pt-1 text-xs font-medium hover:underline'
                    >
                      {t('openStage')}
                      <ArrowRight className='size-3.5' />
                    </button>
                  </div>
                </div>

                {/* Nút ⊕ / ⊖ ở góc trên phải thẻ (Hình 9, Hình 10). */}
                <button
                  type='button'
                  onClick={() => toggleStage(stage.id, stage.topics[0]?.id)}
                  aria-expanded={open}
                  aria-label={t('openStage')}
                  className='bg-primary text-primary-foreground absolute top-3 right-3 flex size-8 items-center justify-center rounded-full transition-transform hover:scale-105'
                >
                  {open ? <Minus className='size-4' /> : <Plus className='size-4' />}
                </button>
              </article>
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
                  {/* Hình 10: mỗi thẻ chủ đề có biểu tượng bên trái tên. */}
                  <span className='flex items-start gap-2.5'>
                    <span className='text-primary mt-0.5 shrink-0'>
                      <TopicIcon topicId={topic.id} />
                    </span>
                    <span className='min-w-0'>
                      <span className='block text-sm font-medium'>{topic.title}</span>
                      <span className='text-muted-foreground block text-xs'>
                        {t('articleCount', { count: counts[topic.id] ?? 0 })}
                      </span>
                    </span>
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
                    {/* Hình 10: cuối mỗi dòng là nút tròn ⊕ xanh, không phải mũi tên. */}
                    <span className='bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full'>
                      <Plus className='size-3.5' />
                    </span>
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
