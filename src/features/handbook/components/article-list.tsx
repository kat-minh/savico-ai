'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { EmptyState, Photo } from '@/shared/components/common'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { handbookArticleRoute } from '@/shared/constants/routes'
import { useDebouncedValue } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'
import { ARTICLE_PAGE_SIZE, HANDBOOK_CATEGORIES } from '../constants/handbook.constants'
import { useHandbookArticles } from '../hooks/use-handbook'
import { pageCount, pageSlice, sortByNewest } from '../services/handbook.service'
import type { HandbookCategory } from '../types/handbook.types'

const ALL = 'all'

/**
 * Khối "Tất cả bài viết" (Phần 3.2, nửa dưới Hình 11): danh sách đầy đủ, lọc
 * theo chuyên mục, kèm ô tìm kiếm và phân trang.
 *
 * PHỤ LỤC bản mô tả v1.1 — dấu (+) trên dòng bài: bấm dấu (+) hoặc bất kỳ đâu
 * trên dòng thì dòng MỞ NHẸ TẠI CHỖ, hiện sapo 1–2 câu kèm liên kết "Xem chi
 * tiết"; dấu + xoay thành ×, bấm lại để đóng. Không rời trang, không đổi URL —
 * chỉ khi bấm "Xem chi tiết" mới mở trọn bài. Trước đây dấu (+) nhảy thẳng sang
 * trang bài viết, đó chính là lỗi phụ lục yêu cầu sửa.
 */
export function ArticleList() {
  const t = useTranslations('handbook.articles')
  const format = useFormatter()

  const [category, setCategory] = useState<HandbookCategory | typeof ALL>(ALL)
  const [term, setTerm] = useState('')
  const [page, setPage] = useState(1)
  /** Dòng bài đang mở nhanh; chỉ một dòng mở tại một thời điểm (phụ lục Cẩm nang). */
  const [openId, setOpenId] = useState<string | null>(null)

  const query = useDebouncedValue(term, 250).trim().toLowerCase()
  const { data: articles, isPending } = useHandbookArticles()

  const results = useMemo(() => {
    const pool = sortByNewest(articles ?? [])
    return pool.filter((article) => {
      if (category !== ALL && article.category !== category) return false
      if (!query) return true
      return `${article.title} ${article.excerpt}`.toLowerCase().includes(query)
    })
  }, [articles, category, query])

  const totalPages = pageCount(results.length, ARTICLE_PAGE_SIZE)
  const safePage = Math.min(page, totalPages)
  const visible = pageSlice(results, safePage, ARTICLE_PAGE_SIZE)

  return (
    <section id='all-articles' className='bg-card space-y-5 rounded-2xl border p-5'>
      <div className='flex flex-wrap items-center gap-3'>
        <h2 className='text-xl font-semibold tracking-tight'>{t('title')}</h2>

        <div className='flex flex-wrap gap-2'>
          {([ALL, ...HANDBOOK_CATEGORIES] as (HandbookCategory | typeof ALL)[]).map((option) => (
            <button
              key={option}
              type='button'
              onClick={() => {
                setCategory(option)
                setPage(1)
              }}
              aria-pressed={category === option}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                category === option
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'text-muted-foreground hover:border-primary/40'
              )}
            >
              {option === ALL ? t('all') : t(`categories.${option}`)}
            </button>
          ))}
        </div>

        <div className='relative ml-auto min-w-56'>
          <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            value={term}
            onChange={(event) => {
              setTerm(event.target.value)
              setPage(1)
            }}
            placeholder={t('searchPlaceholder')}
            className='pl-9'
          />
        </div>
      </div>

      {isPending ? (
        <div className='space-y-3'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-20 rounded-xl' />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState title={t('empty.title')} description={t('empty.description')} />
      ) : (
        <ul className='divide-y'>
          {visible.map((article) => {
            const expanded = openId === article.id
            return (
              <li key={article.id}>
                {/* Cả dòng là vùng bấm — trên mobile dòng bài trở thành thẻ nên
                    chạm đâu cũng mở, đúng hành vi phụ lục yêu cầu. */}
                <button
                  type='button'
                  onClick={() => setOpenId(expanded ? null : article.id)}
                  aria-expanded={expanded}
                  className='hover:bg-muted/40 flex w-full flex-wrap items-center gap-4 rounded-lg px-1 py-3 text-left transition-colors'
                >
                  <Photo
                    className='size-16 shrink-0 rounded-lg'
                    src={article.imageUrl}
                    alt={article.title}
                    sizes='64px'
                  />
                  <div className='min-w-0 flex-1 space-y-1'>
                    <Badge variant='secondary'>{t(`categories.${article.category}`)}</Badge>
                    <h3 className='text-sm font-semibold'>{article.title}</h3>
                  </div>
                  <p className='text-muted-foreground shrink-0 text-xs'>
                    {format.dateTime(new Date(article.publishedAt), { dateStyle: 'short' })}
                    <span aria-hidden> · </span>
                    {t('readingTime', { minutes: article.readingMinutes })}
                  </p>
                  <span
                    aria-label={expanded ? t('collapse') : t('expand')}
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full transition-transform duration-200',
                      expanded ? 'bg-primary text-primary-foreground rotate-45' : 'bg-accent text-primary-strong'
                    )}
                  >
                    <Plus className='size-4' />
                  </span>
                </button>

                {/* Mở nhẹ tại chỗ (~¼ giây), không rời trang, không đổi URL. */}
                <div
                  className={cn(
                    'grid transition-all duration-200 ease-out',
                    expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  )}
                >
                  <div className='overflow-hidden'>
                    <div className='px-1 pb-3 sm:pl-20'>
                      <p className='text-muted-foreground text-sm text-pretty'>{article.excerpt}</p>
                      <Link
                        href={handbookArticleRoute(article.slug)}
                        className='text-primary hover:text-primary/80 mt-2 inline-flex items-center gap-1.5 text-sm font-medium'
                      >
                        {t('viewDetail')}
                        <ArrowRight className='size-4' />
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav className='flex items-center justify-center gap-1.5' aria-label={t('pagination')}>
          <button
            type='button'
            onClick={() => setPage(Math.max(1, safePage - 1))}
            disabled={safePage === 1}
            aria-label={t('previousPage')}
            className='text-muted-foreground hover:border-primary/40 flex size-8 items-center justify-center rounded-md border transition-colors disabled:opacity-40'
          >
            <ChevronLeft className='size-4' />
          </button>

          {pageItems(safePage, totalPages).map((item, index) =>
            item === ELLIPSIS ? (
              <span key={`gap-${index}`} className='text-muted-foreground px-1 text-sm'>
                …
              </span>
            ) : (
              <button
                key={item}
                type='button'
                onClick={() => setPage(item)}
                aria-current={item === safePage ? 'page' : undefined}
                className={cn(
                  'size-8 rounded-md border text-sm font-medium transition-colors',
                  item === safePage
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'text-muted-foreground hover:border-primary/40'
                )}
              >
                {item}
              </button>
            )
          )}

          <button
            type='button'
            onClick={() => setPage(Math.min(totalPages, safePage + 1))}
            disabled={safePage === totalPages}
            aria-label={t('nextPage')}
            className='text-muted-foreground hover:border-primary/40 flex size-8 items-center justify-center rounded-md border transition-colors disabled:opacity-40'
          >
            <ChevronRight className='size-4' />
          </button>
        </nav>
      ) : null}
    </section>
  )
}

/** Dấu ngắt quãng giữa các số trang. */
const ELLIPSIS = 0

/**
 * Dãy số trang rút gọn kiểu `‹ 1 2 3 … 12 ›` (Hình 11).
 *
 * Luôn giữ trang đầu, trang cuối và các trang quanh trang hiện tại; phần bị bỏ
 * thay bằng {@link ELLIPSIS}. Không rút gọn thì 12 trang trở lên sẽ tràn hàng.
 */
function pageItems(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const around = [current - 1, current, current + 1].filter((page) => page > 1 && page < total)
  const pages = [1, ...around, total]

  return pages.flatMap((page, index) => {
    const previous = pages[index - 1]
    return previous !== undefined && page - previous > 1 ? [ELLIPSIS, page] : [page]
  })
}
