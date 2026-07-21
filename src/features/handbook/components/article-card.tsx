import { Photo } from '@/shared/components/common'
import { cn } from '@/shared/lib/utils'
import type { HandbookArticle } from '../types/handbook.types'

/** Bài viết tư vấn tĩnh — chọn theo loại công trình / kiểu kiến trúc đã chọn. */
export function ArticleCard({ article, className }: { article: HandbookArticle; className?: string }) {
  return (
    <article className={cn('bg-card flex gap-3 overflow-hidden rounded-xl border p-3', className)}>
      <Photo className='size-20 shrink-0 rounded-lg' src={article.imageUrl} alt={article.title} sizes='80px' />
      <div className='min-w-0 space-y-1'>
        <h3 className='line-clamp-2 text-sm font-semibold'>{article.title}</h3>
        <p className='text-muted-foreground line-clamp-2 text-xs leading-relaxed'>{article.excerpt}</p>
      </div>
    </article>
  )
}
