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
    messengerUrl: 'https://m.me/savico',
    facebookUrl: 'https://facebook.com/savico'
  }
} as const

export type SiteConfig = typeof siteConfig
