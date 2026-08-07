import { env } from './env'

/**
 * Static, app-wide metadata. Keep marketing / SEO copy out of this file —
 * user-facing text lives in translation messages (next-intl).
 */
export const siteConfig = {
  name: env.NEXT_PUBLIC_APP_NAME,
  url: env.NEXT_PUBLIC_APP_URL,
  // Default theme handed to next-themes.
  defaultTheme: 'system' as const,
  /**
   * Contact & social channels. Placeholders until SAVICO provides the real
   * Fanpage / Zalo OA links and hotline (see stakeholder Q&A §3.3.1).
   */
  contact: {
    hotline: '1900 0000',
    email: 'hello@savico.ai',
    zaloUrl: 'https://zalo.me/0000000000',
    messengerUrl: 'https://m.me/savico'
  },
  /**
   * Mạng xã hội hiện ở cột 4 của footer (mục II.2). Placeholder cho tới khi
   * Bên A gửi link Fanpage / Zalo OA / YouTube / TikTok thật.
   */
  social: {
    facebookUrl: 'https://facebook.com/savico',
    zaloOaUrl: 'https://zalo.me/0000000000',
    youtubeUrl: 'https://youtube.com/@savico',
    tiktokUrl: 'https://tiktok.com/@savico'
  },
  /**
   * Thông tin pháp lý ở hàng đáy footer (mục II.2). Placeholder — Bên A chốt
   * tên công ty và MST.
   */
  legal: {
    taxCode: '0000000000'
  }
} as const

export type SiteConfig = typeof siteConfig
