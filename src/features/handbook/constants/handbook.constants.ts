import type { HandbookTags } from '../types/handbook.types'

/** Màn chờ Bước 2 luôn hiển thị đúng 3 mẫu (mục III.3a). */
export const PERSONALIZED_TEMPLATE_COUNT = 3

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

/** Panel cẩm nang thu nhỏ về nút nổi ở góc màn hình (mục III.3a). */
export const HANDBOOK_PANEL_STORAGE_KEY = 'savico.handbook-panel'
