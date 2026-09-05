'use client'

import { Headphones } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { cmsText, useCmsDocument } from '@/shared/cms'
import { Logo } from '@/shared/components/common'
import { siteConfig } from '@/shared/config/site'
import { ROUTES } from '@/shared/constants/routes'

/**
 * Thanh trên cùng RÚT GỌN của luồng thanh toán (Hình S03, S04, S06, S07, S08).
 *
 * Các màn checkout không dùng thanh điều hướng của site: ảnh chỉ vẽ logo bên
 * trái và một dòng "Bạn cần hỗ trợ?" bên phải. Bỏ menu ở đây là có chủ đích —
 * đang giữa luồng trả tiền thì không mời khách bấm đi chỗ khác.
 */
export function CheckoutHeader() {
  const t = useTranslations('checkout')
  const tNav = useTranslations('nav')
  const settings = useCmsDocument('settings')
  const hotline = cmsText(settings.hotline, siteConfig.contact.hotline)

  return (
    <header className='bg-background sticky top-0 z-40 border-b'>
      <div className='mx-auto flex h-18 w-full max-w-[90rem] items-center justify-between gap-6 px-4 lg:px-8'>
        <Link href={ROUTES.HOME} aria-label={t('steps.plan')} className='shrink-0'>
          <Logo tagline={tNav('brandTagline')} />
        </Link>

        <a
          href={`tel:${hotline.replace(/\s/g, '')}`}
          className='text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors'
        >
          <Headphones className='text-primary size-5' />
          {t('headerSupport')}
        </a>
      </div>
    </header>
  )
}
