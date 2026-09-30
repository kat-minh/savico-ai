import type { HandbookFilter } from '../types/handbook.types'

export const handbookKeys = {
  all: ['handbook'] as const,

  templates: () => [...handbookKeys.all, 'templates'] as const,
  templateList: (filter: HandbookFilter) => [...handbookKeys.templates(), filter] as const,
  templateDetail: (id: string) => [...handbookKeys.templates(), 'detail', id] as const,

  articles: () => [...handbookKeys.all, 'articles'] as const,
  articleList: (topic: string) => [...handbookKeys.articles(), topic] as const,
  articleDetail: (slug: string) => [...handbookKeys.articles(), 'detail', slug] as const,

  libraryFilters: (kind: string) => [...handbookKeys.all, 'library-filters', kind] as const,
  templateIdsByStyle: (params: object) => [...handbookKeys.all, 'template-ids-by-style', params] as const,
  newsCategoryTree: () => [...handbookKeys.all, 'news-category-tree'] as const,

  stages: () => [...handbookKeys.all, 'stages'] as const,
  quota: () => [...handbookKeys.all, 'quota'] as const
} as const
