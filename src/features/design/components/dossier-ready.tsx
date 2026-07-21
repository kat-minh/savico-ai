'use client'

import { Download, Link2, Loader2, Mail, MessageCircle, Phone, QrCode, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/routing'
import { siteConfig } from '@/shared/config/site'
import { Button } from '@/shared/components/ui/button'
import { formatNumber } from '@/shared/utils'
import { useDownloadDossier } from '../hooks/use-download-dossier'
import type { Dossier, EstimateResult } from '../types/design.types'
import type { DossierProjectInfo } from './dossier-overview'
import { DossierShareDialog, type ShareMode } from './dossier-share-dialog'

interface DossierReadyProps {
  dossier: Dossier
  /** Kết quả Bước 2 — nguồn của bảng dự toán in trong hồ sơ PDF. */
  result: EstimateResult | undefined
  info: DossierProjectInfo
  /** Đoạn văn tư vấn ở Bước 2, in kèm vào hồ sơ. */
  advisory: string[]
  /** Gọi khi cần token chia sẻ mà `dossier.shareToken` còn trống. */
  onRequestShareLink: () => void
  onSendEmail: (email: string) => Promise<void>
}

/**
 * Bước 3 — trạng thái ĐÃ render xong (mục III.4c).
 * Tiêu đề sẵn sàng + lời cảm ơn, 4 nút thao tác đã kích hoạt, ghi chú bảo mật
 * và khối chuyển đổi liên hệ kiến trúc sư ở cuối trang.
 */
export function DossierReady({ dossier, result, info, advisory, onRequestShareLink, onSendEmail }: DossierReadyProps) {
  const t = useTranslations('design.dossier')
  const locale = useLocale() as Locale
  const { contact } = siteConfig
  const [shareMode, setShareMode] = useState<ShareMode>(null)
  const pdf = useDownloadDossier({ dossier, result, info, advisory })

  const sizeMb = pdf.size ? formatNumber(pdf.size / 1_000_000, locale, { maximumFractionDigits: 1 }) : null

  function openShare(mode: Exclude<ShareMode, null>) {
    if (!dossier.shareToken) onRequestShareLink()
    setShareMode(mode)
  }

  return (
    <div className='mx-auto w-full max-w-3xl space-y-8 px-4 py-12 text-center lg:px-8'>
      <header className='space-y-3'>
        <h1 className='text-3xl font-semibold tracking-tight text-balance'>{t('readyTitle')}</h1>
        <p className='text-muted-foreground text-pretty'>{t('readyThanks')}</p>
      </header>

      <div className='grid gap-3 sm:grid-cols-2'>
        <Button size='lg' onClick={() => void pdf.download()} disabled={pdf.isPending}>
          {pdf.isPending ? <Loader2 className='size-4 animate-spin' /> : <Download className='size-4' />}
          {t('actions.downloadPdf')}
          {sizeMb && !pdf.isPending ? (
            <span className='text-primary-foreground/70 ml-1 text-xs'>{t('pdfSize', { size: sizeMb })}</span>
          ) : null}
        </Button>
        <Button size='lg' variant='outline' onClick={() => openShare('link')}>
          <Link2 className='size-4' />
          {t('actions.shareLink')}
        </Button>
        <Button size='lg' variant='outline' onClick={() => openShare('email')}>
          <Mail className='size-4' />
          {t('actions.email')}
        </Button>
        <Button size='lg' variant='outline' onClick={() => openShare('qr')}>
          <QrCode className='size-4' />
          {t('actions.qr')}
        </Button>
      </div>

      <DossierShareDialog
        mode={shareMode}
        onOpenChange={(open) => setShareMode(open ? shareMode : null)}
        token={dossier.shareToken}
        onSendEmail={onSendEmail}
      />

      <p className='text-muted-foreground bg-muted/40 flex items-center justify-center gap-2 rounded-xl border p-4 text-sm'>
        <ShieldCheck className='size-4 shrink-0' />
        {t('privacyNote')}
      </p>

      {/* Khối chuyển đổi cuối trang. */}
      <section className='bg-primary/5 border-primary/20 space-y-4 rounded-2xl border p-8'>
        <h2 className='text-lg font-semibold text-balance'>{t('ctaTitle')}</h2>
        <div className='flex flex-col justify-center gap-3 sm:flex-row'>
          <Button asChild size='lg'>
            <a href={`tel:${contact.hotline.replace(/\s/g, '')}`}>
              <Phone className='size-4' />
              {t('ctaCall')}
            </a>
          </Button>
          <Button asChild size='lg' variant='outline'>
            <a href={contact.zaloUrl} target='_blank' rel='noreferrer'>
              <MessageCircle className='size-4' />
              {t('ctaZalo')}
            </a>
          </Button>
        </div>
      </section>
    </div>
  )
}
