/** Các thao tác chính mà video hướng dẫn bám theo, sắp theo bước (mục II.4). */
export type GuideTopic = 'land-photo' | 'input' | 'read-estimate' | 'dossier' | 'share'

/** Video hướng dẫn ngắn 20–60 giây cho từng thao tác chính. */
export interface GuideVideo {
  id: string
  topic: GuideTopic
  title: string
  description: string
  thumbnailUrl: string
  videoUrl: string
  /** Thời lượng tính bằng giây. */
  durationSeconds: number
  /**
   * Video nổi bật hiện lớn ở đầu trang Hướng dẫn (mục VI). Admin chọn video nào
   * là nổi bật (mục X, #3); chỉ MỘT video mang cờ này.
   */
  featured?: boolean
}

/** Bài hướng dẫn dạng chữ kèm ảnh. */
export interface GuideArticle {
  id: string
  topic: GuideTopic
  title: string
  excerpt: string
  imageUrl: string
}
