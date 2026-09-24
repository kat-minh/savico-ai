'use client'

import { Facebook, Instagram, Youtube } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useState, type CSSProperties, type ReactNode } from 'react'

import { Link } from '@/i18n/navigation'
import { cmsText, useCmsDocument } from '@/shared/cms'
import { TikTokIcon, Logo, TurnkeyRequestDialog, ZaloIcon } from '@/shared/components/common'
import { siteConfig } from '@/shared/config/site'
import { cn } from '@/shared/lib/utils'
import { FOOTER_ABOUT_LINKS, FOOTER_PRODUCT_LINKS, FOOTER_SUPPORT_LINKS, type FooterLink } from './site-footer.config'

/**
 * Mot muc trong cot link. `href: null` = trang chua dung: hien mo, khong bam
 * duoc thay vi tro toi route chet (xem `site-footer.config.ts`).
 */
function FooterNavLink({
  link,
  label,
  pendingLabel,
  index,
  onAction
}: {
  link: FooterLink
  label: string
  pendingLabel: string
  index: number
  onAction?: (action: NonNullable<FooterLink['action']>) => void
}) {
  if (link.action && onAction) {
    const action = link.action
    return (
      <motion.li
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.44, delay: 0.18 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          type='button'
          onClick={() => onAction(action)}
          className='footer-animated-link text-footer-foreground/75 hover:text-footer-foreground relative inline-block text-left text-sm transition-colors'
        >
          {label}
        </button>
      </motion.li>
    )
  }

  if (!link.href) {
    return (
      <motion.li
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.42, delay: 0.18 + index * 0.07 }}
      >
        <span
          aria-disabled='true'
          title={pendingLabel}
          className='text-footer-foreground/35 cursor-default text-sm select-none'
        >
          {label}
        </span>
      </motion.li>
    )
  }

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.44, delay: 0.18 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={link.href}
        className='footer-animated-link text-footer-foreground/75 hover:text-footer-foreground relative inline-block text-sm transition-colors'
      >
        {label}
      </Link>
    </motion.li>
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
  pendingLabel,
  onAction
}: {
  title: string
  links: readonly FooterLink[]
  pendingLabel: string
  onAction?: (action: NonNullable<FooterLink['action']>) => void
}) {
  const t = useTranslations('footer')
  return (
    <nav aria-label={title}>
      <ColumnTitle>{title}</ColumnTitle>
      <ul className='space-y-2.5'>
        {links.map((link, index) => (
          <FooterNavLink
            key={link.labelKey}
            link={link}
            label={t(`links.${link.labelKey}`)}
            pendingLabel={pendingLabel}
            index={index}
            onAction={onAction}
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
  const [turnkeyOpen, setTurnkeyOpen] = useState(false)

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
    { href: cmsText(settings.zaloUrl, social.zaloOaUrl), label: t('social.zaloOa'), icon: <ZaloIcon /> },
    { href: social.instagramUrl, label: t('social.instagram'), icon: <Instagram className='size-4' /> }
  ]

  const pendingLabel = t('comingSoon')

  return (
    // Nen toi o ca light lan dark (quy uoc xuyen suot, muc I).
    <footer className='bg-footer text-footer-foreground mt-auto'>
      <div className='mx-auto grid w-full max-w-[90rem] gap-10 px-4 pt-10 pb-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.2fr] lg:gap-10 lg:px-8 lg:pt-14'>
        {/* Cot 1 - Thuong hieu */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Dưới `lg` logo phóng 1.4 lần (`zoom` ăn vào bố cục, khác `scale`) để chiếm hơn nửa bề ngang
              hàng thay vì ~40% như trước; từ `lg` giữ cỡ cũ. */}
          <div className='max-lg:[zoom:1.4]'>
            <Logo onDark />
          </div>
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
                    'footer-social-link',
                    'bg-brand-orange/15 text-brand-orange flex size-9 items-center justify-center rounded-full',
                    'hover:bg-brand-orange hover:text-white transition-colors'
                  )}
                >
                  {item.icon}
                </a>
              </li>
            ))}
          </ul>
        </motion.div>

        {[
          { title: t('productTitle'), links: FOOTER_PRODUCT_LINKS },
          { title: t('supportTitle'), links: FOOTER_SUPPORT_LINKS },
          { title: t('aboutTitle'), links: FOOTER_ABOUT_LINKS }
        ].map((column, index) => (
          <motion.div
            key={column.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.58, delay: (index + 1) * 0.14, ease: [0.22, 1, 0.36, 1] }}
          >
            <LinkColumn
              onAction={() => setTurnkeyOpen(true)}
              title={column.title}
              links={column.links}
              pendingLabel={pendingLabel}
            />
          </motion.div>
        ))}

        {/* Cot 5 - Lien he */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.58, delay: 0.56, ease: [0.22, 1, 0.36, 1] }}
          style={{ '--footer-contact-delay': '0.56s' } as CSSProperties}
        >
          <ColumnTitle>{t('contactTitle')}</ColumnTitle>
          <ul className='text-footer-foreground/75 space-y-2.5 text-sm'>
            <motion.li
              initial={{ opacity: 0, y: 5 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.42, delay: 0.74, ease: [0.22, 1, 0.36, 1] }}
            >
              {t('hotline')}:{' '}
              <a
                href={`tel:${hotline.replace(/\s/g, '')}`}
                className='footer-animated-link hover:text-footer-foreground relative inline-block transition-colors'
              >
                {hotline}
              </a>
            </motion.li>
            <motion.li
              initial={{ opacity: 0, y: 5 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.42, delay: 0.81, ease: [0.22, 1, 0.36, 1] }}
            >
              {t('emailLabel')}:{' '}
              <a
                href={`mailto:${email}`}
                className='footer-animated-link hover:text-footer-foreground relative inline-block transition-colors'
              >
                {email}
              </a>
            </motion.li>
            <motion.li
              initial={{ opacity: 0, y: 5 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.42, delay: 0.88, ease: [0.22, 1, 0.36, 1] }}
            >
              {t('addressLabel')}: {cmsText(settings.address, t('address'))}
            </motion.li>
          </ul>
        </motion.div>
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
      <TurnkeyRequestDialog open={turnkeyOpen} onOpenChange={setTurnkeyOpen} />
    </footer>
  )
}
