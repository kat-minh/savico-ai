'use client'

import { Menu } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import { Button } from '@/shared/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/components/ui/sheet'
import { cn } from '@/shared/lib/utils'
import { SITE_NAV } from './site-nav.config'

interface SiteNavMobileProps {
  /** Khối tài khoản (đăng nhập hoặc menu người dùng) do lớp app truyền vào. */
  account?: ReactNode
}

/**
 * Menu điều hướng cho màn hình hẹp (mục II.1).
 *
 * Dưới `md` thanh ngang không đủ chỗ cho 3 mục; ẩn chúng đi mà không có lối vào
 * khác đồng nghĩa người dùng điện thoại không tới được Cẩm nang / Hướng dẫn.
 */
export function SiteNavMobile({ account }: SiteNavMobileProps) {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant='ghost' size='icon' aria-label={t('menu')} className='md:hidden'>
          <Menu className='size-5' />
        </Button>
      </SheetTrigger>

      <SheetContent side='right' className='w-[17rem] p-0'>
        <SheetHeader className='border-b px-5 py-4 text-left'>
          <SheetTitle className='text-base'>{t('menu')}</SheetTitle>
        </SheetHeader>

        <nav className='flex flex-col p-2'>
          {SITE_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                  active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-foreground/[0.06]'
                )}
              >
                {t(item.labelKey)}
              </Link>
            )
          })}
        </nav>

        {account ? <div className='mt-auto border-t p-4'>{account}</div> : null}
      </SheetContent>
    </Sheet>
  )
}
