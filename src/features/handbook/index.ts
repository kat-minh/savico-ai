/**
 * Public API of the `handbook` feature — Cẩm nang (mục II.3) và bảng
 * "Cẩm nang cá nhân hóa" dùng ở màn chờ Bước 2 / Bước 3.
 */
export { HandbookBrowser } from './components/handbook-browser'
export { PersonalizedPanel } from './components/personalized-panel'
export { TemplateCard } from './components/template-card'
export { TemplateDetailDialog } from './components/template-detail-dialog'
export { ArticleCard } from './components/article-card'
export { useHandbookTemplates, useHandbookArticles, usePersonalizedTemplates } from './hooks/use-handbook'
export { selectPersonalizedTemplates, matchesTags } from './services/handbook.service'
export { useHandbookPanelStore } from './store/handbook-panel.store'
export { PERSONALIZED_TEMPLATE_COUNT, TAG_RELAXATION_ORDER } from './constants/handbook.constants'
export type {
  HandbookArticle,
  HandbookFilter,
  HandbookPanelTab,
  HandbookTags,
  HandbookTemplate
} from './types/handbook.types'
