/**
 * Public API của feature `admin` — khu quản trị SAVICO AI.
 *
 * Giao diện chạy trên Ant Design (chỉ nạp trong route group `(admin)`), dữ liệu
 * đọc/ghi kho nội dung dùng chung `shared/cms` nên sửa ở đây là site công khai
 * đổi theo.
 */
export { AdminShell } from './components/layout/admin-shell'
export { AdminOverview } from './components/dashboard/admin-overview'

/**
 * Nội dung site — MỘT màn cho mỗi trang công khai. Các trình soạn và bảng dữ
 * liệu bên trong không xuất ra ngoài nữa: chúng là TAB của `ContentWorkspace`,
 * không còn là màn đứng riêng.
 */
export { ContentWorkspace } from './components/pages/content-workspace'
export {
  ADMIN_CONTENT_PAGES,
  adminContentPageOf,
  type AdminContentPage,
  type AdminContentPageKey
} from './constants/admin-pages.config'

// Cấu hình hệ thống — con số điều khiển cách hệ thống chạy.
export { PlanManager } from './components/business/plan-manager'
export { QuotaEditor } from './components/business/quota-editor'
export { ConsultPackageManager } from './components/consult/package-manager'

// Vận hành — dữ liệu backend sinh ra, vẫn là màn đứng riêng.
export { BookingCalendar } from './components/consult/booking-calendar'
export { RescheduleManager } from './components/consult/reschedule-manager'
export { SubscriptionManager } from './components/business/subscription-manager'
export { TransactionManager } from './components/business/transaction-manager'
export { ReviewManager } from './components/consult/review-manager'
export { ReportManager } from './components/business/report-manager'
export { ProjectManager } from './components/business/project-manager'
export { CustomerManager } from './components/business/customer-manager'

export { CatalogManager } from './components/catalog/catalog-manager'
export { PricingManager } from './components/catalog/pricing-manager'

export { ADMIN_NAV, ADMIN_NAV_ITEMS, type AdminNavGroup, type AdminNavItem } from './components/layout/admin-nav.config'
export { adminApi } from './api/admin.api'
export { adminKeys } from './api/admin.keys'
export {
  useAdminCollection,
  useCmsLocale,
  useAdminDocument,
  useAdminStats,
  useDeleteAdminItem,
  useReorderAdminCollection,
  useResetAdminContent,
  useSaveAdminDocument,
  useSaveAdminItem
} from './hooks/use-admin-data'
export { useCmsLocaleStore } from './store/cms-locale.store'
export { newAdminId, slugify, todayKey } from './services/admin.service'
export { ADMIN_CONTENT_COLLECTIONS, type AdminStats } from './types/admin.types'
