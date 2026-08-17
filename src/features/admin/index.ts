/**
 * Public API của feature `admin` — khu quản trị SAVICO AI.
 *
 * Giao diện chạy trên Ant Design (chỉ nạp trong route group `(admin)`), dữ liệu
 * đọc/ghi kho nội dung dùng chung `shared/cms` nên sửa ở đây là site công khai
 * đổi theo.
 */
export { AdminShell } from './components/layout/admin-shell'
export { AdminOverview } from './components/dashboard/admin-overview'

export { HomeContentEditor } from './components/content/home-content-editor'
export { StaticPagesEditor } from './components/content/static-pages-editor'
export { SiteSettingsEditor } from './components/content/site-settings-editor'

export { TemplateManager } from './components/handbook/template-manager'
export { ArticleManager } from './components/handbook/article-manager'
export { GuideManager } from './components/guide/guide-manager'

export { ConsultantManager } from './components/consult/consultant-manager'
export { BookingManager } from './components/consult/booking-manager'

export { PlanManager } from './components/business/plan-manager'
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
