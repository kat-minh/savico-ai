export const guideKeys = {
  all: ['guide'] as const,
  videos: () => [...guideKeys.all, 'videos'] as const,
  articles: () => [...guideKeys.all, 'articles'] as const
} as const
