'use client'

import { useMemo } from 'react'
import { Clock, FileText, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { ErrorState, Photo } from '@/shared/components/common'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/shared/components/ui/breadcrumb'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ROUTES, handbookArticleRoute } from '@/shared/constants/routes'
import { cn } from '@/shared/lib/utils'
import { useHandbookArticle, useHandbookArticles, useHandbookStages } from '../hooks/use-handbook'
import { articlesOfTopic, selectRelatedArticles } from '../services/handbook.service'
import { ConsultButton } from './consult-button'

interface ArticleDetailProps {
  slug: string
  /** Bấm "Tạo dự án mới" ở khối mời cuối cột phải — do lớp app truyền vào. */
  onCreateProject?: () => void
}

/**
 * Trang bài viết (Phần 3.3, Hình 12).
 *
 * Đường dẫn phân cấp bốn cấp theo đúng cấu trúc Cẩm nang → giai đoạn → chủ đề →
 * bài. Cột phải liệt kê các bài cùng chủ đề để đọc tiếp mà không rời chủ đề.
 */
export function ArticleDetail({ slug, onCreateProject }: ArticleDetailProps) {
  const t = useTranslations('handbook.article')

  const { data: article, isPending, isError } = useHandbookArticle(slug)
  const { data: articles } = useHandbookArticles()
  const { data: stages } = useHandbookStages()

  const stage = stages?.find((item) => item.id === article?.stage)
  const topic = stage?.topics.find((item) => item.id === article?.topicId)

  const siblings = useMemo(
    () => (article?.topicId ? articlesOfTopic(articles ?? [], article.topicId) : []),
    [articles, article]
  )
  const related = useMemo(() => (article ? selectRelatedArticles(articles ?? [], article) : []), [articles, article])

  if (isPending) return <ArticleDetailSkeleton />
  if (isError || !article) return <ErrorState title={t('notFound')} description={t('notFoundHint')} />

  return (
    <div className='mx-auto w-full max-w-[88rem] space-y-8 px-4 py-10 lg:px-8'>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={ROUTES.HANDBOOK}>{t('breadcrumbRoot')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {stage ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={ROUTES.HANDBOOK}>{stage.title}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          ) : null}
          {topic ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={ROUTES.HANDBOOK}>{topic.title}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          ) : null}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{article.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='grid gap-6 lg:grid-cols-[1.7fr_1fr]'>
        <article className='bg-card space-y-5 rounded-2xl border p-6'>
          {stage || topic ? (
            <Badge variant='secondary'>{[stage?.title, topic?.title].filter(Boolean).join(' · ')}</Badge>
          ) : (
            <Badge variant='secondary'>{t(`categories.${article.category}`)}</Badge>
          )}

          <h1 className='text-3xl font-semibold tracking-tight text-balance'>{article.title}</h1>

          <p className='text-muted-foreground flex flex-wrap items-center gap-2 text-sm'>
            {/* Hình 12 ghi "Cập nhật 08/2026" — dựng chuỗi MM/YYYY thay vì để
                Intl tự chọn ("tháng 08, 2026" ở locale vi). */}
            {t('updatedAt', { date: formatMonthYear(article.publishedAt) })}
            <span aria-hidden>·</span>
            <Clock className='size-4' />
            {t('readingTime', { minutes: article.readingMinutes })}
          </p>

          <Photo
            className='aspect-16/9 w-full rounded-xl'
            src={article.imageUrl}
            alt={article.title}
            sizes='(max-width: 1024px) 100vw, 760px'
            priority
          />

          <div className='space-y-6'>
            {article.body.map((section, index) => (
              <section key={section.heading ?? index} className='space-y-3'>
                {section.heading ? (
                  <h2 className='text-primary text-lg font-semibold'>
                    {index + 1}. {section.heading}
                  </h2>
                ) : null}
                {/* Hình 12: đoạn có ảnh thì chữ chiếm cột trái rộng hơn, ảnh
                    nằm phải và căn theo đầu đoạn — không kéo cao bằng cột chữ. */}
                <div
                  className={cn(
                    'space-y-2',
                    section.imageUrl && 'sm:grid sm:grid-cols-[1.35fr_1fr] sm:items-start sm:gap-4 sm:space-y-0'
                  )}
                >
                  <div className='space-y-2'>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className='text-sm leading-relaxed'>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {section.imageUrl ? (
                    <Photo
                      className='aspect-4/3 w-full rounded-lg'
                      src={section.imageUrl}
                      alt={section.heading ?? article.title}
                      sizes='(max-width: 640px) 100vw, 340px'
                    />
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        </article>

        <aside className='space-y-4'>
          {siblings.length > 0 && topic ? (
            <section className='bg-card rounded-2xl border p-5'>
              <h2 className='text-base font-semibold'>{t('inTopic', { topic: topic.title })}</h2>
              <ul className='mt-3 divide-y'>
                {siblings.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={handbookArticleRoute(item.slug)}
                      className={cn(
                        'hover:text-primary block py-2.5 text-sm transition-colors',
                        item.id === article.id && 'text-primary bg-primary/5 -mx-2 rounded-lg px-2 font-medium'
                      )}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Khối mời tạo dự án — chuyển người đọc từ tra cứu sang dùng sản phẩm. */}
          <section className='bg-primary/5 border-primary/30 space-y-3 rounded-2xl border p-5'>
            <FileText className='text-primary size-8' />
            {/* Hình 12 gọi đích danh chủ đề: "Chưa chắc nên chọn móng nào?" */}
            <p className='font-semibold text-balance'>
              {topic ? t('ctaTitleTopic', { topic: topic.title.toLocaleLowerCase('vi') }) : t('ctaTitle')}
            </p>
            <Button className='w-full' onClick={onCreateProject}>
              <Plus className='size-4' />
              {t('ctaButton')}
            </Button>
          </section>

          <section className='bg-card rounded-2xl border p-5'>
            <ConsultButton variant='link' />
          </section>
        </aside>
      </div>

      {related.length > 0 ? (
        <section className='bg-card space-y-4 rounded-2xl border p-5'>
          <h2 className='text-lg font-semibold'>{t('related')}</h2>
          <ul className='grid gap-4 sm:grid-cols-3'>
            {related.map((item) => (
              <li key={item.id}>
                <Link
                  href={handbookArticleRoute(item.slug)}
                  className='hover:border-primary/50 flex h-full gap-3 rounded-xl border p-3 transition-colors'
                >
                  <Photo className='size-16 shrink-0 rounded-lg' src={item.imageUrl} alt={item.title} sizes='64px' />
                  <span className='min-w-0 space-y-1'>
                    <span className='line-clamp-2 block text-sm font-medium'>{item.title}</span>
                    {/* Hình 12: "Phần thô · 5 phút đọc" rồi tới liên kết "Đọc thêm". */}
                    <span className='text-muted-foreground block text-xs'>
                      {[
                        stages?.find((s) => s.id === item.stage)?.title,
                        t('readingTime', { minutes: item.readingMinutes })
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    <span className='text-primary block text-xs font-medium'>{t('readMore')} →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

/** "2026-08-06" → "08/2026" (Hình 12). */
function formatMonthYear(iso: string): string {
  const date = new Date(iso)
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

function ArticleDetailSkeleton() {
  return (
    <div className='grid gap-6 lg:grid-cols-[1.7fr_1fr]'>
      <div className='space-y-4'>
        <Skeleton className='h-10 w-3/4' />
        <Skeleton className='aspect-16/9 w-full rounded-xl' />
        <Skeleton className='h-40 w-full' />
      </div>
      <Skeleton className='h-72 rounded-2xl' />
    </div>
  )
}
