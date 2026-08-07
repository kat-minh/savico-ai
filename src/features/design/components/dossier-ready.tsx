'use client'

import {
  ArrowRight,
  Check,
  Download,
  Link2,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  QrCode,
  ShieldCheck
} from 'lucide-react'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/routing'
import { siteConfig } from '@/shared/config/site'
import { EstimateSheet, Photo, PlanDrawing } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { RENDER_IMAGE } from '@/shared/lib/imagery'
import { cn } from '@/shared/lib/utils'
import { formatNumber } from '@/shared/utils'
import { useDownloadDossier } from '../hooks/use-download-dossier'
import { costShares } from '../services/estimate.service'
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
 * Bốn tệp của bộ hồ sơ (mục IV.8, Hình 11). Danh mục chốt theo mục XII.1 —
 * mục đó chưa có trong bản v2.0 nên tạm giữ đúng thứ tự và tên trong Hình 11.
 */
const FILES = [
  { key: 'exterior', kind: 'pdf' },
  { key: 'architecture', kind: 'pdf' },
  { key: 'structure', kind: 'pdf' },
  { key: 'estimate', kind: 'xlsx' }
] as const

type FileKey = (typeof FILES)[number]['key']

/**
 * Bước 3 — trạng thái ĐÃ render xong (mục IV.8, Hình 11).
 *
 * Dấu tích lớn + lời cảm ơn, rồi hai cột: "Tệp hồ sơ" (lưới 4 thẻ tệp kèm dòng
 * bảo mật) và "Tải xuống & chia sẻ". Cuối trang là dải chuyển đổi liên hệ KTS.
 */
export function DossierReady({ dossier, result, info, advisory, onRequestShareLink, onSendEmail }: DossierReadyProps) {
  const t = useTranslations('design.dossier')
  const locale = useLocale() as Locale
  const { contact } = siteConfig
  const [shareMode, setShareMode] = useState<ShareMode>(null)
  const pdf = useDownloadDossier({ dossier, result, info, advisory })

  const sizeMb = pdf.size ? formatNumber(pdf.size / 1_000_000, locale, { maximumFractionDigits: 1 }) : null

  const shares = result ? costShares(result.sections) : null
  const percents: [number, number, number] | undefined = shares
    ? [
        shares.find((s) => s.section === 'structure')?.percent ?? 0,
        shares.find((s) => s.section === 'finishing')?.percent ?? 0,
        shares.find((s) => s.section === 'interior')?.percent ?? 0
      ]
    : undefined

  /** Ảnh thu nhỏ của từng tệp — dùng lại chính artefact mà hồ sơ chứa. */
  function thumbnail(key: FileKey) {
    switch (key) {
      case 'exterior':
        return <Photo className='size-full' src={RENDER_IMAGE.villa} alt={t(`files.${key}`)} sizes='140px' />
      case 'architecture':
        return <PlanDrawing className='size-full' />
      case 'structure':
        // Chưa có bản vẽ kết cấu riêng nên tạm dùng lại nét vẽ kỹ thuật — đúng
        // thể loại hơn là mượn trang bìa. Backend sẽ trả thumbnail thật.
        return <PlanDrawing className='size-full' />
      case 'estimate':
        return <EstimateSheet className='size-full' total={result?.grandTotal} percents={percents} />
    }
  }

  function openShare(mode: Exclude<ShareMode, null>) {
    if (!dossier.shareToken) onRequestShareLink()
    setShareMode(mode)
  }

  return (
    <div className='mx-auto w-full max-w-6xl space-y-5 px-4 py-8 lg:px-8'>
      <header className='space-y-3 text-center'>
        <span className='bg-primary text-primary-foreground mx-auto flex size-14 items-center justify-center rounded-full'>
          <Check className='size-7' strokeWidth={3} />
        </span>
        <h1 className='text-2xl font-semibold tracking-tight text-balance sm:text-3xl'>{t('readyTitle')}</h1>
        <p className='text-muted-foreground text-pretty'>{t('readyThanks')}</p>
      </header>

      <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]'>
        {/* Cột TRÁI — Tệp hồ sơ */}
        <section className='bg-card rounded-2xl border p-5'>
          <h2 className='mb-4 font-semibold tracking-tight'>{t('filesTitle')}</h2>

          <ul className='grid gap-4 sm:grid-cols-2'>
            {FILES.map(({ key, kind }, index) => (
              <li key={key} className='flex gap-3 rounded-xl border p-3'>
                <span className='bg-muted size-24 shrink-0 overflow-hidden rounded-lg'>{thumbnail(key)}</span>

                <div className='flex min-w-0 flex-col gap-1'>
                  <div className='flex items-start gap-2'>
                    <span
                      className={cn(
                        'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-white',
                        kind === 'pdf' ? 'bg-destructive' : 'bg-primary'
                      )}
                    >
                      {kind.toUpperCase()}
                    </span>
                    <span className='text-[13px] leading-snug font-semibold'>
                      {String(index + 1).padStart(2, '0')}. {t(`files.${key}`)}
                    </span>
                  </div>

                  {/* Số trang và dung lượng do backend trả khi có file thật —
                      mock chưa dựng file nên chỉ nêu định dạng, không bịa số. */}
                  <span className='text-muted-foreground text-xs'>{kind.toUpperCase()}</span>

                  <span className='text-primary mt-auto inline-flex items-center gap-1 text-xs font-medium'>
                    {t('previewAction')}
                    <ArrowRight className='size-3' />
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <p className='bg-muted/50 text-muted-foreground mt-4 flex items-center gap-2 rounded-xl p-3 text-sm'>
            <ShieldCheck className='text-primary size-4 shrink-0' />
            {t('privacyNote')}
          </p>
        </section>

        {/* Cột PHẢI — Tải xuống & chia sẻ */}
        <aside className='bg-card h-fit space-y-3 rounded-2xl border p-5'>
          <h2 className='font-semibold tracking-tight'>{t('downloadTitle')}</h2>

          <Button size='lg' className='h-12 w-full' onClick={() => void pdf.download()} disabled={pdf.isPending}>
            {pdf.isPending ? <Loader2 className='size-4 animate-spin' /> : <Download className='size-4' />}
            {/* Hình 11: "Tải hồ sơ PDF ~46 MB" — cỡ nằm cùng dòng, cùng cỡ chữ,
                dấu "~" báo đây là số ước tính cho tới khi file được dựng. */}
            {t('actions.downloadPdf')}
            {sizeMb && !pdf.isPending ? <span>{t('pdfSize', { size: sizeMb })}</span> : null}
          </Button>

          <Button size='lg' variant='outline' className='h-12 w-full' onClick={() => openShare('link')}>
            <Link2 className='size-4' />
            {t('actions.shareLink')}
          </Button>
          <Button size='lg' variant='outline' className='h-12 w-full' onClick={() => openShare('email')}>
            <Mail className='size-4' />
            {t('actions.email')}
          </Button>
          <Button size='lg' variant='outline' className='h-12 w-full' onClick={() => openShare('qr')}>
            <QrCode className='size-4' />
            {t('actions.qr')}
          </Button>

          <p className='text-muted-foreground pt-1 text-center text-xs'>{t('packagedNote')}</p>
        </aside>
      </div>

      <DossierShareDialog
        mode={shareMode}
        onOpenChange={(open) => setShareMode(open ? shareMode : null)}
        token={dossier.shareToken}
        onSendEmail={onSendEmail}
      />

      {/* Dải chuyển đổi cuối trang. */}
      <section className='bg-accent/60 border-primary/20 flex flex-col items-center gap-4 rounded-2xl border p-6 sm:flex-row sm:justify-between'>
        <h2 className='text-primary-strong font-semibold text-balance'>{t('ctaTitle')}</h2>
        <div className='flex shrink-0 flex-col gap-3 sm:flex-row'>
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
