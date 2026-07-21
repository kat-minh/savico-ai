import { env } from '@/shared/config/env'
import { http } from '@/shared/lib/api'
import type { GuideArticle, GuideVideo } from '../types/guide.types'
import { mockGuideApi } from './guide.mock'

/** Tài liệu hướng dẫn sử dụng — nội dung tĩnh do admin biên soạn. */
const GuideApi = {
  listVideos: () => http.get<GuideVideo[]>('/guide/videos'),
  listArticles: () => http.get<GuideArticle[]>('/guide/articles')
}

export const guideApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockGuideApi : GuideApi
