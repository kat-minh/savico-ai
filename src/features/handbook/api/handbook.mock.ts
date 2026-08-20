import { cmsDb } from '@/shared/cms'
import { mockDelay } from '@/shared/lib/mock'
import type { HandbookArticle, HandbookQuota, HandbookStage, HandbookTemplate } from '../types/handbook.types'

/**
 * Mock của Cẩm nang. Nội dung (mẫu 2D/3D, bài viết, giai đoạn) đọc thẳng từ kho
 * `shared/cms` nên admin sửa trong trang quản trị là trang Cẩm nang đổi theo —
 * đúng mô hình "dữ liệu tĩnh do admin biên soạn" ở mục VI.
 */

/**
 * Hạn mức tra cứu — backend thật đếm theo tài khoản và reset mỗi ngày.
 *
 * Tổng số lượt lấy từ kho nội dung (`quotas`) để vận hành đổi được; phần "còn
 * lại" ở mock giả định người dùng chưa tra lượt nào hôm nay.
 */
function currentQuota(): HandbookQuota {
  const { handbookLookupPerDay, handbookDetailPerDay } = cmsDb.getDocument('quotas')
  return {
    lookupRemaining: handbookLookupPerDay,
    lookupTotal: handbookLookupPerDay,
    detailRemaining: handbookDetailPerDay,
    detailTotal: handbookDetailPerDay
  }
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
    return currentQuota()
  }
}
