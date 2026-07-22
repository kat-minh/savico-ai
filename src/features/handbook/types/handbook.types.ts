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

/** Mẫu tham khảo — thẻ ảnh + tên + tag phong cách + nút ♥. */
export interface HandbookTemplate {
  id: string
  name: string
  imageUrl: string
  /** Nhãn phong cách hiển thị trên thẻ. */
  styleLabel: string
  /** Đoạn mô tả hiện dưới ảnh trong popup xem chi tiết mẫu (mục IV). */
  description: string
  tags: HandbookTags
  /** `layout` cho mẫu bố trí nội thất (Bước 2), `interior` cho mẫu nội thất (Bước 3). */
  kind: 'layout' | 'interior'
}

/** Bài viết tư vấn tĩnh do admin biên soạn. */
export interface HandbookArticle {
  id: string
  title: string
  excerpt: string
  /** Nội dung bài viết, mỗi phần tử một đoạn — hiện trong popup đọc bài. */
  body: string[]
  imageUrl: string
  /** `architecture` cho màn chờ Bước 2, `interior` cho màn chờ Bước 3. */
  topic: 'architecture' | 'interior'
  tags: HandbookTags
}

/** Hai mục trên thanh công cụ dọc của panel cẩm nang (mục III.3a). */
export type HandbookPanelTab = 'templates' | 'articles'
