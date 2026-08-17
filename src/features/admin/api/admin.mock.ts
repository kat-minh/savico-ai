import type { Locale } from '@/i18n/routing'
import { cmsDb } from '@/shared/cms'
import type { CmsCollection, CmsCollectionMap, CmsDocument, CmsDocumentMap } from '@/shared/cms'
import { mockDelay } from '@/shared/lib/mock'
import type { AdminStats } from '../types/admin.types'

/**
 * Mock CRUD của khu quản trị — ghi thẳng vào kho `shared/cms` (localStorage).
 *
 * Nhờ vậy chưa có backend mà sửa nội dung vẫn "thật": lưu xong mở trang công
 * khai là thấy đổi, tải lại trình duyệt vẫn còn. Mọi hàm nhận `locale` vì kho
 * giữ một bản nội dung cho mỗi ngôn ngữ.
 */

function buildStats(locale: Locale): AdminStats {
  const customers = cmsDb.list('customers', locale).filter((user) => user.role === 'customer')
  const projects = cmsDb.list('designProjects', locale)
  const plans = cmsDb.list('plans', locale)

  const priceOf = (tier: string) => plans.find((plan) => plan.tier === tier)?.price ?? 0

  return {
    customers: customers.length,
    subscribers: customers.filter((user) => user.planTier !== null).length,
    projects: projects.length,
    projectsInReview: projects.filter((project) => project.status === 'review').length,
    pendingBookings: cmsDb.list('bookings', locale).filter((booking) => booking.status === 'pending').length,
    revenue: customers.reduce((total, user) => total + (user.planTier ? priceOf(user.planTier) : 0), 0),
    templates: cmsDb.list('handbookTemplates', locale).length,
    articles: cmsDb.list('handbookArticles', locale).length,
    projectsByStatus: (['input', 'designing', 'review', 'completed'] as const).map((status) => ({
      status,
      count: projects.filter((project) => project.status === status).length
    })),
    customersByPlan: (['basic', 'advanced', 'pro', 'none'] as const).map((plan) => ({
      plan,
      count: customers.filter((user) => (user.planTier ?? 'none') === plan).length
    }))
  }
}

export const mockAdminApi = {
  list: async <K extends CmsCollection>(collection: K, locale: Locale): Promise<CmsCollectionMap[K][]> => {
    await mockDelay(200)
    return cmsDb.list(collection, locale)
  },

  save: async <K extends CmsCollection>(
    collection: K,
    item: CmsCollectionMap[K],
    locale: Locale
  ): Promise<CmsCollectionMap[K]> => {
    await mockDelay(300)
    return cmsDb.upsert(collection, item, locale)
  },

  remove: async <K extends CmsCollection>(collection: K, id: string, locale: Locale): Promise<void> => {
    await mockDelay(250)
    cmsDb.remove(collection, id, locale)
  },

  reorder: async <K extends CmsCollection>(
    collection: K,
    items: CmsCollectionMap[K][],
    locale: Locale
  ): Promise<void> => {
    await mockDelay(200)
    cmsDb.replace(collection, items, locale)
  },

  getDocument: async <K extends CmsDocument>(document: K, locale: Locale): Promise<CmsDocumentMap[K]> => {
    await mockDelay(150)
    return cmsDb.getDocument(document, locale)
  },

  saveDocument: async <K extends CmsDocument>(
    document: K,
    value: CmsDocumentMap[K],
    locale: Locale
  ): Promise<CmsDocumentMap[K]> => {
    await mockDelay(300)
    return cmsDb.saveDocument(document, value, locale)
  },

  stats: async (locale: Locale): Promise<AdminStats> => {
    await mockDelay(250)
    return buildStats(locale)
  },

  resetContent: async (): Promise<void> => {
    await mockDelay(300)
    cmsDb.reset()
  }
}
