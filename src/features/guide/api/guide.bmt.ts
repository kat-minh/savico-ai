import { http } from '@/shared/lib/api'
import type { PagedResult } from '@/shared/types'
import type { GuideVideo } from '../types/guide.types'
import { mockGuideApi } from './guide.mock'

/**
 * Nối trang Hướng dẫn vào BMT API — GIỮ MOCK LÀM NỀN (như Cẩm nang).
 *
 * BE ship cụm guide dạng danh sách VIDEO YouTube xếp thứ tự (`GET /guides`,
 * `Response.PublicGuide`). Trang khách render các video thành lưới phẳng có tìm
 * kiếm + phân trang theo đúng thứ tự API trả, nên chỉ cần map thẳng.
 *
 * DB backend đang RỖNG nên hàm này TỰ VỀ MOCK khi API trả rỗng / lỗi — demo
 * không bị trống. Khi admin publish guide thật thì dữ liệu API thay cho mock.
 *
 * Hai điểm BE chưa có (đã ghi `docs/BE_API_GAPS.md` mục 2.5), map tạm và KHÔNG
 * ảnh hưởng hiển thị lưới video:
 *   - `topic` (nhóm chủ đề): chỉ dùng cho neo deep-link từ luồng 3 bước và gợi ý
 *     "bước kế tiếp cùng nhóm" → dồn tạm về 'input'.
 *   - `featured` (video nổi bật): lấy video ĐẦU danh sách.
 * `listArticles` (bài hướng dẫn) BE không có endpoint → luôn mock.
 */

/** `GET /guides` (Response.PublicGuide) — video hướng dẫn công khai. */
interface BmtPublicGuide {
  id: string
  title: string
  description: string
  youtubeVideoId: string
  youtubeUrl: string
  metadata: { thumbnailUrl: string; durationSeconds: number; fetchedAtUtc: string }
}

function toGuideVideo(guide: BmtPublicGuide, index: number): GuideVideo {
  return {
    id: guide.id,
    // BE chưa có nhóm chủ đề — dồn tạm, không lọc hiển thị (xem chú thích đầu file).
    topic: 'input',
    title: guide.title,
    description: guide.description,
    thumbnailUrl: guide.metadata.thumbnailUrl,
    videoUrl: guide.youtubeUrl,
    durationSeconds: guide.metadata.durationSeconds,
    youtubeId: guide.youtubeVideoId,
    status: 'visible',
    // BE chưa có cờ nổi bật — lấy video đầu danh sách.
    featured: index === 0
  }
}

export const bmtGuideApi = {
  async listVideos(): Promise<GuideVideo[]> {
    try {
      const items: BmtPublicGuide[] = []
      for (let pageIndex = 1; pageIndex <= 20; pageIndex++) {
        const page = await http.get<PagedResult<BmtPublicGuide>>('/guides', {
          params: { pageIndex, pageSize: 100 }
        })
        items.push(...page.items)
        if (!page.hasNextPage) break
      }
      // BE rỗng → về mock để trang demo không trống.
      if (!items.length) return mockGuideApi.listVideos()
      return items.map(toGuideVideo)
    } catch {
      return mockGuideApi.listVideos()
    }
  }
}
