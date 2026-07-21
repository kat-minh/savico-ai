'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

/**
 * Wraps next-themes. Defaults match the design system: class-based dark mode
 * (`.dark`), system preference enabled, and no transition flash on theme change.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange {...props}>
      {children}
    </NextThemesProvider>
  )
}
