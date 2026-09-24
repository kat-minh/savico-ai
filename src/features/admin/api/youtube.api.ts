/**
 * Lấy thông tin video YouTube cho màn Các bước hướng dẫn (epic GuideStepManagement
 * §3–§5) bằng YouTube IFrame Player API — không cần API key: nạp trình phát ẩn,
 * đọc thời lượng khi sẵn sàng. Trình phát báo lỗi đúng ba trường hợp spec nêu:
 * video không tồn tại / riêng tư (100), không cho phát nhúng (101, 150).
 */

export type YouTubeMetaError = 'unavailable' | 'notEmbeddable' | 'failed'

export interface YouTubeMeta {
  durationSeconds: number
  thumbnailUrl: string
}

interface YTPlayer {
  getDuration(): number
  mute(): void
  playVideo(): void
  pauseVideo(): void
  destroy(): void
}

interface YTNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string
      width?: number
      height?: number
      playerVars?: Record<string, number>
      events: {
        onReady?: (event: { target: YTPlayer }) => void
        onStateChange?: (event: { target: YTPlayer; data: number }) => void
        onError?: (event: { data: number }) => void
      }
    }
  ) => YTPlayer
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

const API_SRC = 'https://www.youtube.com/iframe_api'
const TIMEOUT_MS = 15_000
const PLAYING = 1

let apiPromise: Promise<YTNamespace> | null = null

function loadApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  apiPromise ??= new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      if (window.YT) resolve(window.YT)
    }
    const script = document.createElement('script')
    script.src = API_SRC
    script.async = true
    script.onerror = () => {
      apiPromise = null
      reject(new Error('failed'))
    }
    document.head.appendChild(script)
  })
  return apiPromise
}

/** Ảnh thumbnail chuẩn YouTube tạo sẵn cho mọi video công khai. */
export function youTubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

export function youTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
}

/** Trả thời lượng + thumbnail; lỗi thì reject với một `YouTubeMetaError`. */
export async function fetchYouTubeMeta(videoId: string): Promise<YouTubeMeta> {
  const YT = await loadApi().catch(() => {
    throw 'failed' satisfies YouTubeMetaError
  })

  return new Promise<YouTubeMeta>((resolve, reject) => {
    const host = document.createElement('div')
    host.style.cssText = 'position:fixed;left:-10000px;top:0;width:320px;height:180px;pointer-events:none'
    const holder = document.createElement('div')
    host.appendChild(holder)
    document.body.appendChild(host)

    let player: YTPlayer | null = null
    let settled = false
    const finish = (result: YouTubeMeta | YouTubeMetaError) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      try {
        player?.destroy()
      } catch {
        // Trình phát có thể đã tự hủy khi lỗi — không cần làm gì thêm.
      }
      host.remove()
      if (typeof result === 'string') reject(result)
      else resolve(result)
    }
    const timer = window.setTimeout(() => finish('failed'), TIMEOUT_MS)
    const done = (target: YTPlayer) => {
      const seconds = Math.round(target.getDuration())
      if (seconds > 0) finish({ durationSeconds: seconds, thumbnailUrl: youTubeThumbnail(videoId) })
      return seconds > 0
    }

    player = new YT.Player(holder, {
      videoId,
      width: 320,
      height: 180,
      playerVars: { autoplay: 0, controls: 0, playsinline: 1 },
      events: {
        // Thời lượng đôi khi là 0 tới khi video bắt đầu tải — phát tắt tiếng một nhịp rồi đọc lại.
        onReady: ({ target }) => {
          if (done(target)) return
          target.mute()
          target.playVideo()
        },
        onStateChange: ({ target, data }) => {
          if (data !== PLAYING) return
          target.pauseVideo()
          if (!done(target)) finish('failed')
        },
        onError: ({ data }) =>
          finish(data === 100 || data === 2 ? 'unavailable' : data === 101 || data === 150 ? 'notEmbeddable' : 'failed')
      }
    })
  })
}
