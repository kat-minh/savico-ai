'use client'

import { useSyncExternalStore } from 'react'
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'

import { Button } from '@/shared/components/ui/button'

const ORDER = ['light', 'dark', 'system'] as const
type ThemeMode = (typeof ORDER)[number]

const ICON: Record<ThemeMode, LucideIcon> = { light: Sun, dark: Moon, system: Monitor }

const isMode = (v: string | undefined): v is ThemeMode => v === 'light' || v === 'dark' || v === 'system'

/** Stable no-op subscribe so `useSyncExternalStore` only distinguishes SSR vs client. */
const emptySubscribe = () => () => {}

/** One-click theme cycler: light → dark → system → light. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const t = useTranslations('theme')

  // Gate on hydration so SSR and first paint render the same icon.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  const current: ThemeMode = mounted && isMode(theme) ? theme : 'system'
  const Icon = ICON[current]
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]!

  return (
    <Button variant='ghost' size='icon' aria-label={t('toggle')} title={t(current)} onClick={() => setTheme(next)}>
      <Icon className='size-4' />
      <span className='sr-only'>{t('toggle')}</span>
    </Button>
  )
}
