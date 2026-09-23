/**
 * Public API của feature `admin` — khu quản trị SAVICO AI.
 *
 * Giao diện chạy trên Ant Design (chỉ nạp trong route group `(admin)`), dữ liệu
 * đọc/ghi kho nội dung dùng chung `shared/cms` nên sửa ở đây là site công khai
 * đổi theo.
 */
export { AdminShell } from './components/layout/admin-shell'
export { AdminInbox } from './components/dashboard/admin-inbox'
export { AdminCharts } from './components/dashboard/admin-charts'
/** Trang số liệu cũ — tạm không gắn route nào, trang Tổng quan giờ là hàng đợi việc. */
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

// Thư viện — kho mẫu và video do đội nội dung nhập, đứng riêng khỏi nhóm CMS
// theo trang: đây là BẢNG BẢN GHI thêm/sửa/xóa hằng ngày, không phải chữ của
// một trang cụ thể.
export { TemplateManager } from './components/handbook/template-manager'
export { GuideVideoManager } from './components/guide/guide-manager'

// Vận hành — dữ liệu backend sinh ra, vẫn là màn đứng riêng.
export { OrderManager } from './components/ops/order-manager'
export { DiscountManager } from './components/ops/discount-manager'
export { SurveyManager } from './components/ops/survey-manager'
export { ContractorManager } from './components/ops/contractor-manager'
export { ChangeRequestManager } from './components/ops/change-request-manager'
export { SupervisionPackageManager } from './components/ops/supervision-package-manager'
export { BookingManager } from './components/consult/booking-manager'
/** Bản lịch tháng cũ — tạm không gắn route, lịch tư vấn giờ là bảng như các hàng đợi khác. */
export { BookingCalendar } from './components/consult/booking-calendar'
export { RescheduleManager } from './components/consult/reschedule-manager'
export { SubscriptionManager } from './components/business/subscription-manager'
export { TransactionManager } from './components/business/transaction-manager'
export { ReviewManager } from './components/consult/review-manager'
export { ReportManager } from './components/business/report-manager'
export { ProjectManager } from './components/business/project-manager'
export { InvitationManager } from './components/business/invitation-manager'
export { InspectionManager } from './components/business/inspection-manager'
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
