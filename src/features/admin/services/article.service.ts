import type { HandbookArticle } from '@/shared/cms'

/**
 * Quy tắc bài viết Cẩm nang (ArticleManagement, BR-134 → BR-137) — thuần.
 */

/** Bốn vị trí nổi bật: 01 bài chính, 02–04 bài phụ. */
export const FEATURED_SLOTS = [1, 2, 3, 4] as const

/** Nội dung tối đa 10.000 ký tự (BR-134). */
export const MAX_ARTICLE_CONTENT = 10_000

export function articleContentLength(article: HandbookArticle): number {
  return article.body.reduce(
    (sum, section) =>
      sum + (section.heading?.length ?? 0) + section.paragraphs.reduce((total, item) => total + item.length, 0),
    0
  )
}

export type ArticleProblem = 'image' | 'title' | 'label' | 'reading' | 'content' | 'handbook'

/** Lý do bài CHƯA được chuyển Active — `null` khi đủ dữ liệu bắt buộc. */
export function articleProblem(article: HandbookArticle, activeLabelIds: readonly string[]): ArticleProblem | null {
  if (!article.imageUrl) return 'image'
  if (!article.title.trim() || article.title.length > 1000) return 'title'
  if (!activeLabelIds.includes(article.category)) return 'label'
  if (!Number.isInteger(article.readingMinutes) || article.readingMinutes < 1) return 'reading'
  const length = articleContentLength(article)
  if (length === 0 || length > MAX_ARTICLE_CONTENT) return 'content'
  if (Boolean(article.stage) !== Boolean(article.topicId)) return 'handbook'
  return null
}
