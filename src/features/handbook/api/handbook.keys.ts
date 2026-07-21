import type { HandbookFilter } from '../types/handbook.types'

export const handbookKeys = {
  all: ['handbook'] as const,

  templates: () => [...handbookKeys.all, 'templates'] as const,
  templateList: (filter: HandbookFilter) => [...handbookKeys.templates(), filter] as const,

  articles: () => [...handbookKeys.all, 'articles'] as const,
  articleList: (topic: string) => [...handbookKeys.articles(), topic] as const
} as const
