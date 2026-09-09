'use client'

import { Facebook, Youtube } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { Link } from '@/i18n/navigation'
import { cmsText, useCmsDocument } from '@/shared/cms'
import { TikTokIcon, Logo, ZaloIcon } from '@/shared/components/common'
import { siteConfig } from '@/shared/config/site'
import { cn } from '@/shared/lib/utils'
import { FOOTER_ABOUT_LINKS, FOOTER_PRODUCT_LINKS, FOOTER_SUPPORT_LINKS, type FooterLink } from './site-footer.config'

/**
 * Mot muc trong cot link. `href: null` = trang chua dung: hien mo, khong bam
 * duoc thay vi tro toi route chet (xem `site-footer.config.ts`).
 */
function FooterNavLink({ link, label, pendingLabel }: { link: FooterLink; label: string; pendingLabel: string }) {
  if (!link.href) {
    return (
      <li>
        <span
          aria-disabled='true'
          title={pendingLabel}
          className='text-footer-foreground/35 cursor-default text-sm select-none'
        >
          {label}
        </span>
      </li>
    )
  }

  return (
    <li>
      <Link
        href={link.href}
        className='text-footer-foreground/75 hover:text-footer-foreground text-sm transition-colors'
      >
        {label}
      </Link>
    </li>
  )
}

/** Tieu de cot - chu nho, in hoa, gian chu. */
function ColumnTitle({ children }: { children: ReactNode }) {
  return <h2 className='mb-4 text-xs font-semibold tracking-[0.12em] uppercase'>{children}</h2>
}

/** Mot cot lien ket. */
function LinkColumn({
  title,
  links,
  pendingLabel
}: {
  title: string
  links: readonly FooterLink[]
  pendingLabel: string
}) {
  const t = useTranslations('footer')
  return (
    <nav aria-label={title}>
      <ColumnTitle>{title}</ColumnTitle>
      <ul className='space-y-2.5'>
        {links.map((link) => (
          <FooterNavLink
            key={link.labelKey}
            link={link}
            label={t(`links.${link.labelKey}`)}
            pendingLabel={pendingLabel}
          />
        ))}
      </ul>
    </nav>
  )
}

/**
 * Footer dung chung cho moi trang (quy uoc xuyen suot, muc I).
 *
 * Dung theo anh mockup khach gui: nen toi, nam cot - thuong hieu (logo, mo ta,
 * mang xa hoi), San pham, Ho tro, Ve SAVICO, Lien he - va mot hang day chi con
 * dong ban quyen.
 *
 * Cot lien he la chu thuan chu khong phai danh sach icon: trong anh no la ba
 * dong "Hotline / Email / Dia chi" xep nhu mot cot chu, cung nhip voi ba cot
 * lien ket ben canh.
 */
export function SiteFooter() {
  const t = useTranslations('footer')
  const year = new Date().getFullYear()
  const { contact, social } = siteConfig
  // Noi dung lien he / mang xa hoi do admin sua (muc X). Chua sua thi roi ve
  // hang so trong `shared/config/site.ts` va ban dich i18n.
  const settings = useCmsDocument('settings')

  const hotline = cmsText(settings.hotline, contact.hotline)
  const email = cmsText(settings.email, contact.email)

  const socialLinks = [
    {
      href: cmsText(settings.facebookUrl, social.facebookUrl),
      label: t('social.facebook'),
      icon: <Facebook className='size-4' />
    },
    {
      href: cmsText(settings.youtubeUrl, social.youtubeUrl),
      label: t('social.youtube'),
      icon: <Youtube className='size-4' />
    },
    { href: cmsText(settings.tiktokUrl, social.tiktokUrl), label: t('social.tiktok'), icon: <TikTokIcon /> },
    { href: cmsText(settings.zaloUrl, social.zaloOaUrl), label: t('social.zaloOa'), icon: <ZaloIcon /> }
  ]

  const pendingLabel = t('comingSoon')

  return (
    // Nen toi o ca light lan dark (quy uoc xuyen suot, muc I).
    <footer className='bg-footer text-footer-foreground mt-auto'>
      <div className='mx-auto grid w-full max-w-[90rem] gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.2fr] lg:gap-10 lg:px-8'>
        {/* Cot 1 - Thuong hieu */}
        <div>
          <Logo onDark tagline={t('brandTagline')} />
          <p className='text-footer-foreground/70 mt-4 max-w-xs text-sm leading-relaxed'>
            {cmsText(settings.tagline, t('tagline'))}
          </p>

          <ul className='mt-5 flex gap-2.5'>
            {socialLinks.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target='_blank'
                  rel='noreferrer'
                  aria-label={item.label}
                  className={cn(
                    'bg-footer-foreground/10 text-primary flex size-9 items-center justify-center rounded-full',
                    'hover:bg-footer-foreground/20 transition-colors'
                  )}
                >
                  {item.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <LinkColumn title={t('productTitle')} links={FOOTER_PRODUCT_LINKS} pendingLabel={pendingLabel} />
        <LinkColumn title={t('supportTitle')} links={FOOTER_SUPPORT_LINKS} pendingLabel={pendingLabel} />
        <LinkColumn title={t('aboutTitle')} links={FOOTER_ABOUT_LINKS} pendingLabel={pendingLabel} />

        {/* Cot 5 - Lien he */}
        <div>
          <ColumnTitle>{t('contactTitle')}</ColumnTitle>
          <ul className='text-footer-foreground/75 space-y-2.5 text-sm'>
            <li>
              {t('hotline')}:{' '}
              <a href={`tel:${hotline.replace(/\s/g, '')}`} className='hover:text-footer-foreground transition-colors'>
                {hotline}
              </a>
            </li>
            <li>
              {t('emailLabel')}:{' '}
              <a href={`mailto:${email}`} className='hover:text-footer-foreground transition-colors'>
                {email}
              </a>
            </li>
            <li>
              {t('addressLabel')}: {cmsText(settings.address, t('address'))}
            </li>
          </ul>
        </div>
      </div>

      {/* Hang day - chi con dong ban quyen (anh mockup). */}
      <div className='border-footer-foreground/15 border-t'>
        {/* `pe-*` chua cho cho chatbox noi goc phai duoi (muc II.3). */}
        <div className='text-footer-foreground/60 mx-auto w-full max-w-[90rem] px-4 py-5 pb-24 text-xs sm:pb-5 sm:pe-44 lg:px-8 lg:pe-52'>
          <p>
            © {year} {cmsText(settings.brandName, siteConfig.name)}. {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  )
}
