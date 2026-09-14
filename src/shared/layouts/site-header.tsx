'use client'

import { Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { type ComponentType, useState } from 'react'

import { Link, usePathname } from '@/i18n/navigation'
import { useAuth } from '@/shared/auth'
import { Logo } from '@/shared/components/common'
import { GuestMenu } from '@/shared/components/guest-menu'
import { Button } from '@/shared/components/ui/button'
import { ROUTES } from '@/shared/constants/routes'
import { useModalOpen, useMounted, usePastElement, useScrollDirection, useScrolled } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'
import { SiteNavMobile } from './site-nav-mobile'
import { SITE_NAV } from './site-nav.config'

interface SiteHeaderProps {
  /** App-layer account dropdown, shown once signed in. Falls back to GuestMenu. */
  UserMenu?: ComponentType<{ onOpenChange?: (open: boolean) => void }>
  /** Opens the "Tạo dự án" modal (mục III.1). Injected by the app layer. */
  onCreateProject?: () => void
}

/**
 * Thanh công cụ cố định trên cùng mọi trang (mục II.1).
 * Nền sáng, logo bên trái, 3 mục điều hướng ở giữa, nút "Tạo dự án mới" và
 * avatar bên phải. Mục đang mở được gạch chân bằng màu thương hiệu.
 *
 * ★ Nền động (mục II.1): mặt kính đặc hơn nền trang, quầng xanh thương hiệu
 * trôi ngang và viền dưới sáng ở giữa — xem `.site-header-shell` trong
 * `globals.css`. Cuộn khỏi đỉnh trang thì header đặc thêm và đổ bóng sâu hơn.
 *
 * Ba hiệu ứng cuộn thêm (mục II.1, và trang Tư vấn 1:1 mục 1):
 * - Bám dính; cuộn xuống → mặt kính đặc + bóng mảnh, về đầu trang thì tắt hẳn
 *   (`scrolled`, ngưỡng 8px). Trang có hero (trang chủ) thì lùi mốc này lại
 *   tới khi cuộn qua HẾT hero — `usePastElement('home-hero-end')` trả `true`
 *   ngay trên trang không có hero, nên hai điều kiện AND với nhau vẫn đúng ở
 *   cả hai loại trang.
 * - Cuộn xuống thì thu gọn chiều cao, cuộn lên thì bung lại — không bao giờ
 *   ẩn hẳn, chỉ đổi chiều cao.
 * - Mục đang chọn có vạch gạch chân riêng mang `layoutId` — đổi trang thì
 *   vạch đó TRƯỢT NGANG sang mục mới thay vì biến mất rồi hiện lại chỗ khác.
 *
 * Có popup nào đang mở (video, menu mobile...) thì mờ theo nền + khoá bấm —
 * trang Hướng dẫn mục 1: "Popup mở → header mờ theo nền, không bấm được".
 */
export function SiteHeader({ UserMenu, onCreateProject }: SiteHeaderProps = {}) {
  const t = useTranslations('nav')
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()

  // Auth state is client-only; gate on hydration so SSR and first paint match.
  const mounted = useMounted()
  const authed = mounted && isAuthenticated
  const scrolled = useScrolled()
  const direction = useScrollDirection()
  const pastHero = usePastElement('home-hero-end')
  const compact = direction === 'down' && scrolled
  const glass = pastHero && scrolled
  const modalOpen = useModalOpen()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const overlayOpen = modalOpen || accountMenuOpen

  const createLabel = t('createProject')

  return (
    <header
      data-scrolled={scrolled}
      className={cn(
        'sticky top-0 z-40 transition-[background-color,box-shadow,opacity] duration-300',
        glass ? 'site-header-shell' : 'bg-transparent',
        overlayOpen && 'pointer-events-none opacity-60'
      )}
    >
      <div
        className={cn(
          'relative mx-auto flex w-full max-w-[90rem] items-center gap-6 px-4 transition-[height] duration-300 lg:px-8',
          compact ? 'h-12' : 'h-16'
        )}
      >
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
                  'group relative rounded-lg px-3 py-2 text-sm transition-colors hover:text-primary',
                  active ? 'text-foreground font-semibold' : 'text-muted-foreground font-medium hover:bg-transparent'
                )}
              >
                {/* Bản mô tả S01: mục này tên "Bảng giá" với khách chưa đăng
                    nhập, "Gói đăng ký" khi đã đăng nhập. */}
                {t(item.labelKey === 'plans' && !authed ? 'plansGuest' : item.labelKey)}
                {active ? (
                  // Mục đang chọn: vạch mang `layoutId` chung — đổi trang thì
                  // Motion tự animate FLIP từ vị trí vạch cũ trượt sang đây,
                  // thay vì mỗi mục tự vẽ vạch riêng rồi ẩn/hiện rời rạc.
                  <motion.span
                    layoutId='nav-active-underline'
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className='bg-primary absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full'
                  />
                ) : (
                  // Mục khác: vạch chạy từ trái sang phải khi rê.
                  <span
                    aria-hidden
                    className='bg-primary absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full transition-transform duration-300 group-hover:scale-x-100 motion-reduce:transition-none'
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className='ml-auto flex items-center gap-2'>
          <Button
            size='sm'
            className='group rounded-xl font-semibold shadow-none! transition-[filter] duration-300 before:opacity-40! hover:brightness-90 hover:shadow-none! hover:before:opacity-0!'
            onClick={onCreateProject}
          >
            <Plus className='size-4 transition-transform duration-500 ease-out group-hover:rotate-[360deg] motion-reduce:transition-none' />
            <span className='hidden sm:inline'>{createLabel}</span>
          </Button>

          {/* Avatar luôn hiện — mục IV: bấm avatar mở Cửa sổ cá nhân. Khách chưa
              đăng nhập thấy cùng một biểu tượng, chỉ khác nội dung dropdown, để
              thanh công cụ không đổi bố cục khi đăng nhập / đăng xuất. */}
          {authed && UserMenu ? (
            <UserMenu onOpenChange={setAccountMenuOpen} />
          ) : (
            <GuestMenu onOpenChange={setAccountMenuOpen} />
          )}

          <SiteNavMobile />
        </div>
      </div>
    </header>
  )
}
