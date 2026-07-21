'use client'

import { useQuery } from '@tanstack/react-query'

import { guideApi } from '../api/guide.api'
import { guideKeys } from '../api/guide.keys'

export function useGuideVideos() {
  return useQuery({
    queryKey: guideKeys.videos(),
    queryFn: () => guideApi.listVideos(),
    staleTime: 5 * 60 * 1000
  })
}

export function useGuideArticles() {
  return useQuery({
    queryKey: guideKeys.articles(),
    queryFn: () => guideApi.listArticles(),
    staleTime: 5 * 60 * 1000
  })
}
