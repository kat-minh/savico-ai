import { MessageCircle, Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { siteConfig } from '@/shared/config/site'
import { ROUTES } from '@/shared/constants/routes'

/**
 * Footer dùng chung cho mọi trang (quy ước xuyên suốt, mục I).
 * Nền tối, hiển thị Hotline và Zalo.
 */
export function SiteFooter() {
  const t = useTranslations('footer')
  const year = new Date().getFullYear()
  const { contact } = siteConfig

  return (
    // Nền tối ở cả light lẫn dark (quy ước xuyên suốt, mục I).
    <footer className='bg-footer text-footer-foreground mt-auto'>
      <div className='mx-auto flex w-full max-w-[90rem] flex-col gap-8 px-4 py-12 lg:flex-row lg:items-center lg:justify-between lg:px-8'>
        <div>
          <p className='text-base font-semibold'>{siteConfig.name}</p>
          <p className='text-footer-foreground/70 mt-2 max-w-sm text-sm leading-relaxed'>{t('tagline')}</p>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <a
            href={`tel:${contact.hotline.replace(/\s/g, '')}`}
            className='bg-footer-foreground/10 hover:bg-footer-foreground/20 flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-medium transition-colors'
          >
            <Phone className='size-4' />
            {t('hotline')}: {contact.hotline}
          </a>
          <a
            href={contact.zaloUrl}
            target='_blank'
            rel='noreferrer'
            className='bg-footer-foreground/10 hover:bg-footer-foreground/20 flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-medium transition-colors'
          >
            <MessageCircle className='size-4' />
            {t('zalo')}
          </a>
        </div>
      </div>

      <div className='border-footer-foreground/15 border-t'>
        <div className='text-footer-foreground/60 mx-auto flex w-full max-w-[90rem] flex-col gap-3 px-4 py-5 text-xs sm:flex-row sm:items-center sm:justify-between lg:px-8'>
          <p>
            © {year} {siteConfig.name}. {t('rights')}
          </p>
          <div className='flex gap-5'>
            <Link href={ROUTES.PRIVACY} className='hover:text-footer-foreground transition-colors'>
              {t('privacy')}
            </Link>
            <Link href={ROUTES.TERMS} className='hover:text-footer-foreground transition-colors'>
              {t('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
