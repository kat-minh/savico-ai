/**
 * Kiểu dữ liệu của Cẩm nang (mục VI).
 *
 * Các bản ghi NỘI DUNG (mẫu, bài viết, giai đoạn) là thứ admin biên soạn nên
 * type của chúng nằm ở `shared/cms` — nơi cả trang Cẩm nang lẫn trang quản trị
 * cùng đọc được. Ở đây chỉ re-export lại để barrel của feature không đổi, cộng
 * thêm các kiểu chỉ giao diện Cẩm nang mới dùng.
 */
export type {
  HandbookArticle,
  HandbookArticleSection,
  HandbookCategory,
  HandbookFloor,
  HandbookStage,
  HandbookStageId,
  HandbookTags,
  HandbookTemplate,
  HandbookTemplateKind,
  HandbookTemplateSpecs,
  HandbookTopic
} from '@/shared/cms'

import type { HandbookTags } from '@/shared/cms'

/** Tiêu chí lọc, dựng từ dữ liệu Bước 1 bởi lớp app. */
export type HandbookFilter = HandbookTags

/**
 * Hạn mức tra cứu thư viện, đếm THEO NGÀY (Phần 2.1 và 2.3).
 *
 * Hai counter tách bạch: mở lưới thư viện tiêu `lookup`, mở trang chi tiết một
 * mẫu tiêu `detail`. Hết lượt thì mời người dùng nâng cấp gói.
 */
export interface HandbookQuota {
  lookupRemaining: number
  lookupTotal: number
  detailRemaining: number
  detailTotal: number
}

/** Hai mục trên thanh công cụ dọc của panel cẩm nang (màn chờ Bước 2 / Bước 3). */
export type HandbookPanelTab = 'templates' | 'articles'

/** Hai tab lớn của trang Cẩm nang (Hình 5, Hình 9). */
export type HandbookPageTab = 'library' | 'news'
