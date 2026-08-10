import { env } from '@/shared/config/env'
import { http } from '@/shared/lib/api'
import type { HandbookArticle, HandbookQuota, HandbookStage, HandbookTemplate } from '../types/handbook.types'
import { mockHandbookApi } from './handbook.mock'

/**
 * Cẩm nang API. Dữ liệu tĩnh do admin biên soạn (mục VI) — the client only
 * reads it, so there is no write surface here. Hạn mức tra cứu là ngoại lệ duy
 * nhất phụ thuộc tài khoản, backend tự đếm theo ngày.
 */
const HandbookApi = {
  listTemplates: () => http.get<HandbookTemplate[]>('/handbook/templates'),

  getTemplate: (id: string) => http.get<HandbookTemplate | null>(`/handbook/templates/${id}`),

  listArticles: (topic?: string) =>
    http.get<HandbookArticle[]>('/handbook/articles', topic ? { params: { topic } } : undefined),

  getArticle: (slug: string) => http.get<HandbookArticle | null>(`/handbook/articles/${slug}`),

  listStages: () => http.get<HandbookStage[]>('/handbook/stages'),

  getQuota: () => http.get<HandbookQuota>('/handbook/quota')
}

export const handbookApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockHandbookApi : HandbookApi
