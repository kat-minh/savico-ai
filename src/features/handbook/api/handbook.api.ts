import { env } from '@/shared/config/env'
import { http } from '@/shared/lib/api'
import type { HandbookArticle, HandbookTemplate } from '../types/handbook.types'
import { mockHandbookApi } from './handbook.mock'

/**
 * Cẩm nang API. Dữ liệu tĩnh do admin biên soạn (mục VI) — the client only
 * reads it, so there is no write surface here.
 */
const HandbookApi = {
  listTemplates: () => http.get<HandbookTemplate[]>('/handbook/templates'),

  listArticles: (topic?: string) =>
    http.get<HandbookArticle[]>('/handbook/articles', topic ? { params: { topic } } : undefined)
}

export const handbookApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockHandbookApi : HandbookApi
