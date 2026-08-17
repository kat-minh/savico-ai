import { cmsDb } from '@/shared/cms'
import { mockDelay } from '@/shared/lib/mock'
import type { GuideArticle, GuideVideo } from '../types/guide.types'

/**
 * Mock của trang Hướng dẫn. Danh sách video / bài viết đọc từ kho `shared/cms`
 * nên admin thêm - sửa - chọn video nổi bật (mục X, #3) là trang này đổi theo.
 */
export const mockGuideApi = {
  listVideos: async (): Promise<GuideVideo[]> => {
    await mockDelay(250)
    return cmsDb.list('guideVideos')
  },
  listArticles: async (): Promise<GuideArticle[]> => {
    await mockDelay(250)
    return cmsDb.list('guideArticles')
  }
}
