import type { Locale } from '@/i18n/routing'
import type { CmsCollection, CmsCollectionMap, CmsDocument, CmsDocumentMap } from '@/shared/cms'
import { env } from '@/shared/config/env'
import { http } from '@/shared/lib/api'
import type { AdminStats } from '../types/admin.types'
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
  consultants: '/admin/consultants',
  bookings: '/admin/bookings',
  customers: '/admin/customers',
  designProjects: '/admin/projects',
  buildingTypes: '/admin/catalog/building-types',
  styleOptions: '/admin/catalog/styles',
  unitPrices: '/admin/catalog/unit-prices'
}

const DOCUMENT_ENDPOINTS: Record<CmsDocument, string> = {
  home: '/admin/content/home',
  settings: '/admin/content/settings',
  termsPage: '/admin/content/pages/terms',
  privacyPage: '/admin/content/pages/privacy'
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
    http.put<CmsDocumentMap[K]>(DOCUMENT_ENDPOINTS[document], value, { params: { locale } }),

  stats: (locale: Locale) => http.get<AdminStats>('/admin/stats', { params: { locale } }),

  /** Backend thật không cho xóa trắng nội dung — chỉ có ý nghĩa ở chế độ mock. */
  resetContent: async (): Promise<void> => {}
}

export const adminApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockAdminApi : AdminApi
