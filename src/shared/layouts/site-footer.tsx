import { Clock, Facebook, Mail, MapPin, Phone, Youtube } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { Link } from '@/i18n/navigation'
import { TikTokIcon, Logo, ZaloIcon } from '@/shared/components/common'
import { siteConfig } from '@/shared/config/site'
import { cn } from '@/shared/lib/utils'
import { FOOTER_POLICY_LINKS, FOOTER_QUICK_LINKS, type FooterLink } from './site-footer.config'

interface SiteFooterProps {
  /**
   * Mục "Tạo dự án mới" của cột Liên kết nhanh — là hành động mở modal chứ
   * không phải route, nên app layer truyền vào (xem `main-footer.tsx`).
   */
  createProjectAction?: ReactNode
}

/** Một dòng liên hệ ở cột 2: icon xanh lá + nội dung. */
function ContactRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className='flex items-start gap-3'>
      <span className='text-primary mt-0.5 shrink-0'>{icon}</span>
      <span className='text-footer-foreground/75 text-sm leading-relaxed'>{children}</span>
    </li>
  )
}

/**
 * Một mục trong cột link. `href: null` = trang chưa dựng: hiện mờ, không bấm
 * được thay vì trỏ tới route chết (xem `site-footer.config.ts`).
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

/** Tiêu đề cột — chữ nhỏ, in hoa, giãn chữ. */
function ColumnTitle({ children }: { children: ReactNode }) {
  return <h2 className='mb-4 text-xs font-semibold tracking-[0.12em] uppercase'>{children}</h2>
}

/**
 * Footer dùng chung cho mọi trang (quy ước xuyên suốt, mục I).
 *
 * ★ Mục II.2 — footer mở rộng: nền tối chữ trắng, icon xanh lá, 4 cột
 * (Thương hiệu · Liên hệ · Liên kết nhanh · Chính sách & mạng xã hội) và một
 * hàng đáy bản quyền + pháp lý.
 *
 * Nội dung chữ hiện là placeholder trong `messages/*.json`; theo mục X toàn bộ
 * phần này sẽ do admin sửa được, không cần deploy.
 */
export function SiteFooter({ createProjectAction }: SiteFooterProps = {}) {
  const t = useTranslations('footer')
  const year = new Date().getFullYear()
  const { contact, social, legal } = siteConfig

  const socialLinks = [
    { href: social.facebookUrl, label: t('social.facebook'), icon: <Facebook className='size-4' /> },
    { href: social.zaloOaUrl, label: t('social.zaloOa'), icon: <ZaloIcon /> },
    { href: social.youtubeUrl, label: t('social.youtube'), icon: <Youtube className='size-4' /> },
    { href: social.tiktokUrl, label: t('social.tiktok'), icon: <TikTokIcon /> }
  ]

  const pendingLabel = t('comingSoon')

  return (
    // Nền tối ở cả light lẫn dark (quy ước xuyên suốt, mục I).
    <footer className='bg-footer text-footer-foreground mt-auto'>
      <div className='mx-auto grid w-full max-w-[90rem] gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1.15fr_1fr_1fr] lg:gap-12 lg:px-8'>
        {/* Cột 1 — Thương hiệu */}
        <div>
          <Logo onDark />
          <p className='text-footer-foreground/70 mt-4 max-w-sm text-sm leading-relaxed'>{t('tagline')}</p>
        </div>

        {/* Cột 2 — Liên hệ */}
        <div>
          <ColumnTitle>{t('contactTitle')}</ColumnTitle>
          <ul className='space-y-3'>
            <ContactRow icon={<Phone className='size-4' />}>
              <a
                href={`tel:${contact.hotline.replace(/\s/g, '')}`}
                className='hover:text-footer-foreground font-medium transition-colors'
              >
                {t('hotline')}: {contact.hotline}
              </a>
            </ContactRow>
            <ContactRow icon={<ZaloIcon />}>
              <a
                href={contact.zaloUrl}
                target='_blank'
                rel='noreferrer'
                className='hover:text-footer-foreground transition-colors'
              >
                {t('zalo')}: {contact.hotline}
              </a>
            </ContactRow>
            <ContactRow icon={<Mail className='size-4' />}>
              <a href={`mailto:${contact.email}`} className='hover:text-footer-foreground transition-colors'>
                {contact.email}
              </a>
            </ContactRow>
            <ContactRow icon={<MapPin className='size-4' />}>{t('address')}</ContactRow>
            <ContactRow icon={<Clock className='size-4' />}>{t('workingHours')}</ContactRow>
          </ul>
        </div>

        {/* Cột 3 — Liên kết nhanh */}
        <nav aria-label={t('quickLinksTitle')}>
          <ColumnTitle>{t('quickLinksTitle')}</ColumnTitle>
          <ul className='space-y-2.5'>
            {FOOTER_QUICK_LINKS.map((link) => (
              <FooterNavLink
                key={link.labelKey}
                link={link}
                label={t(`links.${link.labelKey}`)}
                pendingLabel={pendingLabel}
              />
            ))}
            {createProjectAction ? <li>{createProjectAction}</li> : null}
          </ul>
        </nav>

        {/* Cột 4 — Chính sách & mạng xã hội */}
        <div>
          <ColumnTitle>{t('policyTitle')}</ColumnTitle>
          <ul className='space-y-2.5'>
            {FOOTER_POLICY_LINKS.map((link) => (
              <FooterNavLink
                key={link.labelKey}
                link={link}
                label={t(`links.${link.labelKey}`)}
                pendingLabel={pendingLabel}
              />
            ))}
          </ul>

          <h2 className='mt-8 mb-3 text-xs font-semibold tracking-[0.12em] uppercase'>{t('socialTitle')}</h2>
          <ul className='flex gap-2.5'>
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
      </div>

      {/* Hàng đáy — bản quyền + thông tin pháp lý */}
      <div className='border-footer-foreground/15 border-t'>
        {/* `pe-*` chừa chỗ cho chatbox nổi góc phải dưới (mục II.3) — nếu không
            nút chat sẽ đè lên dòng thông tin pháp lý. */}
        <div className='text-footer-foreground/60 mx-auto flex w-full max-w-[90rem] flex-col gap-2 px-4 py-5 pb-24 text-xs sm:flex-row sm:items-center sm:justify-between sm:pb-5 sm:pe-44 lg:px-8 lg:pe-52'>
          <p>
            © {year} {siteConfig.name}. {t('rights')}
          </p>
          <p>
            {t('company')} · {t('taxCode')}: {legal.taxCode}
          </p>
        </div>
      </div>
    </footer>
  )
}
