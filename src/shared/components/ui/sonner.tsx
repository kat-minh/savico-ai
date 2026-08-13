'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

/**
 * Theme-aware toast portal. Rendered once in {@link AppProviders}.
 * Trigger toasts anywhere via `import { toast } from 'sonner'`.
 */
function Toaster({ ...props }: ToasterProps) {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className='toaster group'
      // Góc phải TRÊN theo Hình 16 (mục VIII.3) — cũng tránh che nút chatbox nổi
      // và các nút hành động chính nằm ở đáy màn hình.
      position='top-right'
      richColors
      closeButton
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)'
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
