import { env } from '@/shared/config/env'
import { bmtGuideApi } from './guide.bmt'
import { mockGuideApi } from './guide.mock'

/**
 * Chức năng đã nối BMT API — GIỮ MOCK LÀM NỀN (tự về mock khi API rỗng/lỗi).
 *
 * Đã nối: `listVideos` (`GET /guides`). `listArticles` (bài hướng dẫn) BE không
 * có endpoint → luôn mock (xem `docs/BE_API_GAPS.md` mục 2.5).
 */
const BmtGuideApi = {
  listVideos: bmtGuideApi.listVideos
} satisfies Partial<typeof mockGuideApi>

export const guideApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockGuideApi : { ...mockGuideApi, ...BmtGuideApi }
