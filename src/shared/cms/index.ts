/**
 * Kho nội dung (CMS) dùng chung.
 *
 * `features/admin` GHI, các feature công khai (handbook, guide, plans,
 * consultation, landing) ĐỌC. Đặt ở `shared/` vì hai feature không được import
 * lẫn nhau — xem docs/ARCHITECTURE.md §2.
 */
export { CMS_LOCALES, cmsDb, cmsDocumentSeedOf, cmsSeedOf, currentCmsLocale, isLocalizedCollection } from './cms.db'
export type { CmsCollection, CmsCollectionMap, CmsDocument, CmsDocumentMap } from './cms.db'
export { cmsText, useCmsCollection, useCmsDocument } from './use-cms'
export type {
  CmsBooking,
  CmsBookingStatus,
  CmsBuildingTypeOption,
  CmsCustomer,
  CmsCustomerStatus,
  CmsDesignProject,
  CmsHomeContent,
  CmsHomePromise,
  CmsHomeStep,
  CmsProjectStatus,
  CmsSiteSettings,
  CmsStaticPage,
  CmsStaticSection,
  CmsStyleOption,
  CmsUnitPrice,
  Consultant,
  ConsultantSpecialty,
  ConsultantWork,
  GuideArticle,
  GuideTopic,
  GuideVideo,
  HandbookArticle,
  HandbookArticleSection,
  HandbookCategory,
  HandbookFloor,
  HandbookStage,
  HandbookStageId,
  HandbookTags,
  HandbookTemplate,
  HandbookTemplateKind,
  HandbookTemplateSpecs,
  HandbookTopic,
  PlanTier,
  SubscriptionPlan
} from './cms.types'
