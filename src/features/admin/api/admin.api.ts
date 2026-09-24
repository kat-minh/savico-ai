import type { Locale } from '@/i18n/routing'
import type { CmsCollection, CmsCollectionMap, CmsDocument, CmsDocumentMap } from '@/shared/cms'
import { env } from '@/shared/config/env'
import { http } from '@/shared/lib/api'
import { mockAdminApi } from './admin.mock'

/**
 * API của khu quản trị.
 *
 * Một bộ hàm generic cho MỌI bảng nội dung thay vì mỗi thực thể một module:
 * bảng nào cũng chỉ cần liệt kê - lưu - xóa - sắp thứ tự, nên tách ra chỉ tạo
 * mười file giống hệt nhau. Bản đồ dưới đây quy đổi tên bảng sang endpoint .NET.
 *
 * Ngôn ngữ nội dung đi kèm mọi lời gọi dưới dạng `?locale=` — backend giữ một
 * bản cho mỗi ngôn ngữ, giống kho mock.
 */
const ENDPOINTS: Record<CmsCollection, string> = {
  handbookTemplates: '/admin/handbook/templates',
  handbookArticles: '/admin/handbook/articles',
  handbookStages: '/admin/handbook/stages',
  guideVideos: '/admin/guide/videos',
  guideArticles: '/admin/guide/articles',
  plans: '/admin/plans',
  gifts: '/admin/gifts',
  costGroups: '/admin/estimate/groups',
  costItems: '/admin/estimate/items',
  materialPrices: '/admin/estimate/material-prices',
  articleLabels: '/admin/handbook/labels',
  supervisionStages: '/admin/supervision/stages',
  supervisionPackages: '/admin/supervision-packages',
  consultants: '/admin/consultants',
  bookings: '/admin/bookings',
  customers: '/admin/customers',
  customerPackages: '/admin/customer-packages',
  quotaEvents: '/admin/quota-events',
  designProjects: '/admin/projects',
  buildingTypes: '/admin/catalog/building-types',
  floorOptions: '/admin/catalog/floor-options',
  styleOptions: '/admin/catalog/styles',
  subscriptions: '/admin/subscriptions',
  transactions: '/admin/transactions',
  rescheduleRequests: '/admin/bookings/reschedule-requests',
  consultPackages: '/admin/consult/packages',
  packageReviews: '/admin/consult/package-reviews',
  reports: '/admin/reports',
  contractorInvitations: '/admin/contractor-invitations',
  supervisionProjects: '/admin/supervision/projects',
  contractors: '/admin/contractors',
  orders: '/admin/orders',
  discountCodes: '/admin/discount-codes'
}

const DOCUMENT_ENDPOINTS: Record<CmsDocument, string> = {
  settings: '/admin/content/settings',
  termsPage: '/admin/content/pages/terms',
  privacyPage: '/admin/content/pages/privacy',
  quotas: '/admin/quotas',
  planSettings: '/admin/plans/settings',
  contractorMatching: '/admin/contractors/matching',
  estimateAdvice: '/admin/estimate/advice',
  surveySchedule: '/admin/contractors/survey-schedule',
  uiStrings: '/admin/content/strings',
  uiAssets: '/admin/content/assets'
}

const AdminApi = {
  list: <K extends CmsCollection>(collection: K, locale: Locale) =>
    http.get<CmsCollectionMap[K][]>(ENDPOINTS[collection], { params: { locale } }),

  save: <K extends CmsCollection>(collection: K, item: CmsCollectionMap[K], locale: Locale) =>
    http.put<CmsCollectionMap[K]>(`${ENDPOINTS[collection]}/${(item as { id: string }).id}`, item, {
      params: { locale }
    }),

  remove: <K extends CmsCollection>(collection: K, id: string, locale: Locale) =>
    http.delete<void>(`${ENDPOINTS[collection]}/${id}`, { params: { locale } }),

  reorder: <K extends CmsCollection>(collection: K, items: CmsCollectionMap[K][], locale: Locale) =>
    http.put<void>(
      `${ENDPOINTS[collection]}/order`,
      { ids: items.map((item) => (item as { id: string }).id) },
      { params: { locale } }
    ),

  getDocument: <K extends CmsDocument>(document: K, locale: Locale) =>
    http.get<CmsDocumentMap[K]>(DOCUMENT_ENDPOINTS[document], { params: { locale } }),

  saveDocument: <K extends CmsDocument>(document: K, value: CmsDocumentMap[K], locale: Locale) =>
    http.put<CmsDocumentMap[K]>(DOCUMENT_ENDPOINTS[document], value, { params: { locale } })
}

export const adminApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockAdminApi : AdminApi
