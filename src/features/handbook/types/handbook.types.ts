import type { PlanVariant } from '@/shared/components/common'

/**
 * Tag set gắn trên mỗi mẫu / bài viết trong cẩm nang (mục VI).
 * Cùng vocabulary với các trường Bước 1 nhưng khai báo độc lập: `features/handbook`
 * không được import `features/design`.
 */
export interface HandbookTags {
  buildingType?: string
  floorCount?: string
  hasAttic?: boolean
  architectureStyle?: string
  interiorStyle?: string
}

/** Tiêu chí lọc, dựng từ dữ liệu Bước 1 bởi lớp app. */
export type HandbookFilter = HandbookTags

/**
 * Hai loại nội dung của thư viện mẫu (Phần 2):
 * `2d` — mẫu bản vẽ mặt bằng, người dùng tìm CÔNG NĂNG;
 * `3d` — mẫu nội thất phối cảnh, người dùng tìm CẢM HỨNG THẨM MỸ.
 */
export type HandbookTemplateKind = '2d' | '3d'

/**
 * Một tầng trong bộ ảnh của mẫu — nút chuyển tầng và dải ảnh xem trước đều
 * chạy trên mảng này (Hình 2, Hình 7, Hình 8).
 */
export interface HandbookFloor {
  id: string
  /** Nhãn nút chuyển tầng: "Tầng trệt", "Tầng 2", "Tum", "Mặt mái". */
  label: string
  /** Ảnh thật của tầng. Mẫu 3D luôn có; mẫu 2D bỏ trống cho tới khi admin tải bản vẽ lên. */
  imageUrl?: string
  /** Khi chưa có ảnh: dựng bản vẽ SVG theo preset này (mẫu 2D). */
  planVariant?: PlanVariant
}

/** Dòng thông số hiện dưới tên mẫu trên thẻ và trong khung "Thông tin bản vẽ". */
export interface HandbookTemplateSpecs {
  buildingTypeLabel: string
  /** "2 tầng", "2 tầng + tum" — nhãn quy mô đã gộp sẵn thông tin tum. */
  floorLabel: string
  /** Kích thước lô, ví dụ "5 × 20 m" (chỉ mẫu 2D). */
  lotSize?: string
  /** Diện tích sàn, ví dụ "100 m²" (chỉ mẫu 2D). */
  floorArea?: string
  /** Số ảnh 3D có trong bộ (chỉ mẫu 3D). */
  imageCount?: number
}

/** Một mẫu trong thư viện — dùng chung cho lưới, popup xem nhanh và trang chi tiết. */
export interface HandbookTemplate {
  id: string
  name: string
  kind: HandbookTemplateKind
  /** Ảnh bìa trên thẻ lưới. Bỏ trống thì thẻ vẽ bản vẽ SVG của tầng đầu tiên. */
  imageUrl?: string
  /** Nhãn tag chính: phong cách (mẫu 3D) hoặc loại công trình (mẫu 2D). */
  styleLabel: string
  specs: HandbookTemplateSpecs
  /**
   * Mô tả bố trí công năng từng tầng (mẫu 2D) hoặc vật liệu / tông màu / cảm
   * giác không gian (mẫu 3D) — mỗi phần tử một đoạn.
   */
  description: string[]
  floors: HandbookFloor[]
  tags: HandbookTags
}

/** Ba giai đoạn xây nhà — khung cố định của cẩm nang nền tảng (Phần 3). */
export type HandbookStageId = 'structure' | 'finishing' | 'interior'

/** Một chủ đề trong giai đoạn, ví dụ "Móng", "Cọc - ép cọc". */
export interface HandbookTopic {
  id: string
  stage: HandbookStageId
  title: string
}

export interface HandbookStage {
  id: HandbookStageId
  /** Số thứ tự hiển thị trên thẻ ("Bước 1"). */
  order: number
  title: string
  description: string
  imageUrl: string
  topics: HandbookTopic[]
}

/** Chuyên mục của bài viết — bộ lọc ở khối "Tất cả bài viết" (Hình 11). */
export type HandbookCategory = 'experience' | 'material' | 'interior' | 'legal'

/** Một mục trong thân bài: tiêu đề đánh số + các đoạn văn, có thể kèm ảnh. */
export interface HandbookArticleSection {
  heading?: string
  paragraphs: string[]
  imageUrl?: string
}

export interface HandbookArticle {
  id: string
  /** Dùng làm đường dẫn: `/handbook/bai-viet/{slug}`. */
  slug: string
  title: string
  excerpt: string
  imageUrl: string
  category: HandbookCategory
  /**
   * Vị trí trong cẩm nang nền tảng. Bỏ trống nghĩa là bài tin tức thuần — chỉ
   * xuất hiện ở Bản tin và danh sách bài viết, không nằm trong cây giai đoạn.
   */
  stage?: HandbookStageId
  topicId?: string
  /** ISO date — "ngày cập nhật" trên trang bài viết. */
  publishedAt: string
  readingMinutes: number
  /** Thứ tự trong Bản tin: 1 = bài nổi bật lớn, 2–4 = ba bài phụ (Hình 11). */
  featuredRank?: number
  body: HandbookArticleSection[]
  tags: HandbookTags
  /** Bài tư vấn trong panel màn chờ: kiến trúc (Bước 2) / nội thất (Bước 3). */
  panelTopic?: 'architecture' | 'interior'
}

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
