import type { CmsCollection, CmsProjectStatus, PlanTier } from '@/shared/cms'

/**
 * Kiểu riêng của khu quản trị. Bản ghi nội dung (mẫu, bài viết, KTS, gói…) dùng
 * type ở `shared/cms` vì site công khai đọc cùng một nguồn.
 */

/** Số liệu của trang Tổng quan. */
export interface AdminStats {
  /** Tổng người dùng đang hoạt động. */
  customers: number
  /** Người dùng đang có gói còn hạn. */
  subscribers: number
  /** Dự án đã tạo. */
  projects: number
  /** Dự án đang chờ duyệt hồ sơ. */
  projectsInReview: number
  /** Lịch hẹn chưa xác nhận. */
  pendingBookings: number
  /** Doanh thu ước tính từ gói đang hiệu lực, VND. */
  revenue: number
  /** Số mẫu trong thư viện Cẩm nang. */
  templates: number
  /** Số bài viết Cẩm nang. */
  articles: number
  /** Số dự án theo từng trạng thái — dựng biểu đồ cột. */
  projectsByStatus: { status: CmsProjectStatus; count: number }[]
  /** Số người dùng theo gói; nhóm cuối là người chưa mua gói. */
  customersByPlan: { plan: PlanTier | 'none'; count: number }[]
}

/**
 * Bảng nào là NỘI DUNG (admin biên soạn, hiện trên site) và bảng nào là VẬN
 * HÀNH (backend sinh ra). Nút "Khôi phục nội dung mặc định" chỉ đụng nhóm đầu.
 */
export const ADMIN_CONTENT_COLLECTIONS: readonly CmsCollection[] = [
  'handbookTemplates',
  'handbookArticles',
  'handbookStages',
  'guideVideos',
  'guideArticles',
  'plans',
  'consultants',
  'buildingTypes',
  'styleOptions',
  'unitPrices'
]
