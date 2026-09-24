import type { GuideVideo } from '@/shared/cms'

/**
 * Quy tắc của epic Quản lý các bước hướng dẫn — thuần, không React, không HTTP.
 */

const VIDEO_ID = /^[\w-]{11}$/
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'])

/**
 * Chuẩn hóa link YouTube về mã video (§3). Chỉ nhận link TỚI MỘT VIDEO:
 * `watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`, `/live/`. Link kênh, danh sách
 * phát, trang chủ hay tên miền khác trả `null`.
 */
export function parseYouTubeId(raw: string): string | null {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const host = url.hostname.toLowerCase()
  let id: string | null = null
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] ?? null
  } else if (YOUTUBE_HOSTS.has(host)) {
    const [, first, second] = url.pathname.split('/')
    if (first === 'watch') id = url.searchParams.get('v')
    else if (first === 'shorts' || first === 'embed' || first === 'live') id = second ?? null
  }
  return id && VIDEO_ID.test(id) ? id : null
}

/** Thứ tự danh sách = thời gian tạo tăng dần (§1); bản ghi cũ thiếu mốc thì giữ thứ tự kho. */
export function sortGuideSteps(videos: readonly GuideVideo[]): GuideVideo[] {
  return videos
    .map((video, index) => ({ video, index }))
    .sort((a, b) => (a.video.createdAt ?? '').localeCompare(b.video.createdAt ?? '') || a.index - b.index)
    .map(({ video }) => video)
}

/** Số bước do hệ thống đánh liên tục từ 1 theo thời gian tạo — không lưu, xóa là tự đánh lại. */
export function guideStepNumbers(videos: readonly GuideVideo[]): Map<string, number> {
  return new Map(sortGuideSteps(videos).map((video, index) => [video.id, index + 1]))
}
