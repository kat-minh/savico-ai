/**
 * Public API of the `guide` feature — trang Hướng dẫn (mục II.4) và khu video
 * nổi bật trên trang chủ (mục II.2).
 */
export { GuideBrowser } from './components/guide-browser'
export { GuideHighlights } from './components/guide-highlights'
export { VideoCard } from './components/video-card'
export { useGuideVideos, useGuideArticles } from './hooks/use-guide'
export { GUIDE_TOPICS, HOME_GUIDE_HIGHLIGHT_COUNT, guideTopicAnchor } from './constants/guide.constants'
export type { GuideArticle, GuideTopic, GuideVideo } from './types/guide.types'
