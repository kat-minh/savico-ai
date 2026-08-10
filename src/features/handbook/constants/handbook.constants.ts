import type { HandbookCategory, HandbookStageId, HandbookTags } from '../types/handbook.types'

/**
 * Màn chờ hiển thị năm mẫu gợi ý (Phần 1.1). Con số này cố định — panel không
 * bao giờ được hiện ít hơn, kể cả khi phải nới lỏng tiêu chí lọc.
 */
export const PERSONALIZED_TEMPLATE_COUNT = 5

/**
 * Thứ tự nới lỏng tiêu chí khi không đủ mẫu khớp hết tag (mục VI):
 * bỏ tum → bỏ số tầng → bỏ kiểu kiến trúc. Các tag còn lại (loại công trình,
 * phong cách nội thất) giữ tới cùng vì chúng quyết định độ liên quan.
 */
export const TAG_RELAXATION_ORDER: readonly (keyof HandbookTags)[] = [
  'hasAttic',
  'floorCount',
  'architectureStyle'
] as const

/** Panel cẩm nang thu nhỏ về nút nổi ở góc màn hình (màn chờ Bước 2 / Bước 3). */
export const HANDBOOK_PANEL_STORAGE_KEY = 'savico.handbook-panel'

/** Số mẫu trên một trang lưới thư viện (Hình 5: "Hiển thị 8 / 84 mẫu"). */
export const LIBRARY_PAGE_SIZE = 8

/** Số bài trên một trang của khối "Tất cả bài viết" (Hình 11). */
export const ARTICLE_PAGE_SIZE = 6

/** Số bài ở khối "Tin tức mới nhất" cuối phần cẩm nang nền tảng (Phần 3.1). */
export const LATEST_NEWS_COUNT = 3

/** Số mẫu tương tự ở cuối trang chi tiết (Phần 2.3). */
export const SIMILAR_TEMPLATE_COUNT = 4

/** Số bài viết liên quan ở cuối trang bài viết (Phần 3.3). */
export const RELATED_ARTICLE_COUNT = 3

/** Ba giai đoạn xây nhà, đúng thứ tự hiển thị trên trang Cẩm nang. */
export const HANDBOOK_STAGES: readonly HandbookStageId[] = ['structure', 'finishing', 'interior'] as const

/** Chuyên mục dùng cho bộ lọc "Tất cả bài viết". */
export const HANDBOOK_CATEGORIES: readonly HandbookCategory[] = ['experience', 'material', 'interior', 'legal'] as const
