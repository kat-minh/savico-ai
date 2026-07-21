import { AuthBootstrap } from '@/features/auth'
import { routing } from '@/i18n/routing'
import { siteConfig } from '@/shared/config/site'
import { AppProviders } from '@/shared/providers'
import type { Metadata } from 'next'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { Be_Vietnam_Pro, Geist, Geist_Mono } from 'next/font/google'
import { notFound } from 'next/navigation'

import '../globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  // 'latin-ext' covers Vietnamese diacritics; Geist has no 'vietnamese' subset.
  subsets: ['latin', 'latin-ext'],
  display: 'swap'
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap'
})

// Display font for headings & the brand shell — full Vietnamese subset support.
const beVietnamPro = Be_Vietnam_Pro({
  variable: '--font-be-vietnam',
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap'
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`
  },
  description: 'Plan, estimate and manage construction projects on one premium platform.',
  metadataBase: new URL(siteConfig.url)
}

/** Pre-render a static shell for every supported locale. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Enable static rendering for this locale segment.
  setRequestLocale(locale)

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${beVietnamPro.variable} font-sans antialiased`}>
        {/* Messages are provided automatically from i18n/request.ts */}
        <NextIntlClientProvider>
          <AppProviders>
            {/* Resolves the session once for the whole app so auth guards
                never deadlock waiting for initialization. */}
            <AuthBootstrap>{children}</AuthBootstrap>
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
