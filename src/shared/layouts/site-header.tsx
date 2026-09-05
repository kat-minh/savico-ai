'use client'

import { Plus, Sparkles, Square } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type ComponentType } from 'react'

import { Link, usePathname } from '@/i18n/navigation'
import { useAuth } from '@/shared/auth'
import { Logo } from '@/shared/components/common'
import { GuestMenu } from '@/shared/components/guest-menu'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants/routes'
import { useMounted, useScrolled } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'
import { SiteNavMobile } from './site-nav-mobile'
import { SITE_NAV } from './site-nav.config'

interface SiteHeaderProps {
  /** App-layer account dropdown, shown once signed in. Falls back to GuestMenu. */
  UserMenu?: ComponentType
  /** Opens the "Tạo dự án" modal (mục III.1). Injected by the app layer. */
  onCreateProject?: () => void
  /** Nền trang chủ đang ở chế độ trơn (`true`) hay quầng động (`false`). */
  plainBackground?: boolean
  /**
   * Bật/tắt giữa nền động và nền trơn giống bản client. Chỉ được app layer truyền
   * vào ở trang chủ; khi không có, nút switch ẩn đi.
   */
  onToggleBackground?: () => void
}

/**
 * Thanh công cụ cố định trên cùng mọi trang (mục II.1).
 * Nền sáng, logo bên trái, 3 mục điều hướng ở giữa, nút "Tạo dự án mới" và
 * avatar bên phải. Mục đang mở được gạch chân bằng màu thương hiệu.
 *
 * ★ Nền động (mục II.1): mặt kính đặc hơn nền trang, quầng xanh thương hiệu
 * trôi ngang và viền dưới sáng ở giữa — xem `.site-header-shell` trong
 * `globals.css`. Cuộn khỏi đỉnh trang thì header đặc thêm và đổ bóng sâu hơn.
 */
export function SiteHeader({
  UserMenu,
  onCreateProject,
  plainBackground = false,
  onToggleBackground
}: SiteHeaderProps = {}) {
  const t = useTranslations('nav')
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()

  // Auth state is client-only; gate on hydration so SSR and first paint match.
  const mounted = useMounted()
  const authed = mounted && isAuthenticated
  const scrolled = useScrolled()

  const createLabel = t('createProject')

  return (
    <header data-scrolled={scrolled} className='site-header-shell sticky top-0 z-40'>
      <div className='relative mx-auto flex h-16 w-full max-w-[90rem] items-center gap-6 px-4 lg:px-8'>
        <Link href={ROUTES.HOME} aria-label={t('home')} className='shrink-0'>
          <Logo tagline={t('brandTagline')} />
        </Link>

        <nav className='absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex'>
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
          <Button size='sm' className='rounded-xl' onClick={onCreateProject}>
            <Plus className='size-4' />
            <span className='hidden sm:inline'>{createLabel}</span>
          </Button>

          {/* Switch nền trang chủ: đối chiếu nền động với nền trơn của bản client.
              Chỉ hiện khi app layer truyền handler (tức ở trang chủ). */}
          {onToggleBackground ? (
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='rounded-xl'
              onClick={onToggleBackground}
              aria-pressed={plainBackground}
            >
              {plainBackground ? <Sparkles className='size-4' /> : <Square className='size-4' />}
              <span className='hidden sm:inline'>{t(plainBackground ? 'bgToggle.toAura' : 'bgToggle.toPlain')}</span>
            </Button>
          ) : null}

          {/* Avatar luôn hiện — mục IV: bấm avatar mở Cửa sổ cá nhân. Khách chưa
              đăng nhập thấy cùng một biểu tượng, chỉ khác nội dung dropdown, để
              thanh công cụ không đổi bố cục khi đăng nhập / đăng xuất. */}
          {authed && UserMenu ? <UserMenu /> : <GuestMenu />}

          <SiteNavMobile />
        </div>
      </div>
    </header>
  )
}
