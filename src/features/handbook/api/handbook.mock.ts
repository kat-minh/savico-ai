import { cmsDb } from '@/shared/cms'
import { mockDelay } from '@/shared/lib/mock'
import type { HandbookArticle, HandbookQuota, HandbookStage, HandbookTemplate } from '../types/handbook.types'

/**
 * Mock của Cẩm nang. Nội dung (mẫu 2D/3D, bài viết, giai đoạn) đọc thẳng từ kho
 * `shared/cms` nên admin sửa trong trang quản trị là trang Cẩm nang đổi theo —
 * đúng mô hình "dữ liệu tĩnh do admin biên soạn" ở mục VI.
 */

/** Hạn mức mẫu — backend thật trả theo tài khoản và reset mỗi ngày. */
const QUOTA: HandbookQuota = {
  lookupRemaining: 3,
  lookupTotal: 3,
  detailRemaining: 2,
  detailTotal: 3
}

export const mockHandbookApi = {
  listTemplates: async (): Promise<HandbookTemplate[]> => {
    await mockDelay()
    return cmsDb.list('handbookTemplates')
  },

  getTemplate: async (id: string): Promise<HandbookTemplate | null> => {
    await mockDelay()
    return cmsDb.find('handbookTemplates', id)
  },

  listArticles: async (topic?: string): Promise<HandbookArticle[]> => {
    await mockDelay()
    const articles = cmsDb.list('handbookArticles')
    if (!topic) return articles
    return articles.filter((article) => article.panelTopic === topic)
  },

  getArticle: async (slug: string): Promise<HandbookArticle | null> => {
    await mockDelay()
    return cmsDb.list('handbookArticles').find((article) => article.slug === slug) ?? null
  },

  listStages: async (): Promise<HandbookStage[]> => {
    await mockDelay()
    return cmsDb.list('handbookStages')
  },

  getQuota: async (): Promise<HandbookQuota> => {
    await mockDelay()
    return QUOTA
  }
}
