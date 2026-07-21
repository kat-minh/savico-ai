'use client'

import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type ComponentType, type ReactNode } from 'react'

import { Link, usePathname } from '@/i18n/navigation'
import { useAuth } from '@/shared/auth'
import { Logo } from '@/shared/components/common'
import { PreferencesMenu } from '@/shared/components/preferences-menu'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants/routes'
import { useMounted } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'
import { SiteNavMobile } from './site-nav-mobile'
import { SITE_NAV } from './site-nav.config'

interface SiteHeaderProps {
  /**
   * App-layer slot wrapping its children in the guest auth popup trigger.
   * `shared/` may not import `features/auth`, so the app layer injects this.
   */
  AuthTrigger?: ComponentType<{ children: ReactNode; className?: string }>
  /** App-layer account dropdown, shown instead of the CTA once signed in. */
  UserMenu?: ComponentType
  /** Opens the "Tạo dự án" modal (mục III.1). Injected by the app layer. */
  onCreateProject?: () => void
}

/**
 * Thanh công cụ cố định trên cùng mọi trang (mục II.1).
 * Nền sáng, logo bên trái, 3 mục điều hướng ở giữa, nút "Tạo dự án mới" và
 * avatar bên phải. Mục đang mở được gạch chân bằng màu thương hiệu.
 */
export function SiteHeader({ AuthTrigger, UserMenu, onCreateProject }: SiteHeaderProps = {}) {
  const t = useTranslations('nav')
  const tAuth = useTranslations('auth.login')
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()

  // Auth state is client-only; gate on hydration so SSR and first paint match.
  const mounted = useMounted()
  const authed = mounted && isAuthenticated

  const createLabel = t('createProject')

  return (
    <header className='bg-background/85 sticky top-0 z-40 border-b backdrop-blur-xl backdrop-saturate-150'>
      <div className='mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 lg:px-8'>
        <Link href={ROUTES.HOME} aria-label={t('home')} className='shrink-0'>
          <Logo />
        </Link>

        <nav className='hidden items-center gap-1 md:flex'>
          {SITE_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'text-foreground after:bg-primary after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:content-[""]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06]'
                )}
              >
                {t(item.labelKey)}
              </Link>
            )
          })}
        </nav>

        <div className='ml-auto flex items-center gap-2'>
          <Button size='sm' className='rounded-full' onClick={onCreateProject}>
            <Plus className='size-4' />
            <span className='hidden sm:inline'>{createLabel}</span>
          </Button>

          {/* Avatar luôn hiện — mục IV: bấm avatar mở Cửa sổ cá nhân. Khách chưa
              đăng nhập không có menu đó nên được một dropdown tuỳ chọn riêng. */}
          {authed && UserMenu ? (
            <UserMenu />
          ) : AuthTrigger ? (
            <>
              <PreferencesMenu />
              <AuthTrigger className='hidden sm:inline-flex'>{tAuth('submit')}</AuthTrigger>
            </>
          ) : (
            <Button asChild size='sm' variant='ghost' className='hidden sm:inline-flex'>
              <Link href={ROUTES.LOGIN}>{tAuth('submit')}</Link>
            </Button>
          )}

          <SiteNavMobile
            account={
              authed ? null : AuthTrigger ? <AuthTrigger className='w-full'>{tAuth('submit')}</AuthTrigger> : null
            }
          />
        </div>
      </div>
    </header>
  )
}
