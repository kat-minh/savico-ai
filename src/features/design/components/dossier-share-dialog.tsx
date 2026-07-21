'use client'

import { Check, Copy, Loader2, Send } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/routing'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { shareRoute } from '@/shared/constants/routes'
import { useMounted } from '@/shared/hooks'

/** Cửa sổ nào đang mở — `null` là đóng hết. */
export type ShareMode = 'link' | 'qr' | 'email' | null

interface DossierShareDialogProps {
  mode: ShareMode
  onOpenChange: (open: boolean) => void
  /** Token chia sẻ do backend cấp; chưa có thì các cửa sổ hiện trạng thái chờ. */
  token: string | null
  onSendEmail: (email: string) => Promise<void>
}

/**
 * Ba thao tác chia sẻ bộ hồ sơ (mục III.4c): tạo link, QR code và gửi email.
 * Gộp một cửa sổ vì cả ba đều xoay quanh cùng một đường dẫn chia sẻ.
 */
export function DossierShareDialog({ mode, onOpenChange, token, onSendEmail }: DossierShareDialogProps) {
  const t = useTranslations('design.dossier.share')
  const locale = useLocale() as Locale

  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  // Đường dẫn tuyệt đối chỉ dựng được sau khi mount (cần origin thật).
  const mounted = useMounted()
  const shareUrl = token && mounted ? `${window.location.origin}/${locale}${shareRoute(token)}` : ''

  function handleOpenChange(open: boolean) {
    if (!open) {
      setCopied(false)
      setSent(false)
    }
    onOpenChange(open)
  }

  async function copy() {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
  }

  async function send() {
    if (!email.trim() || sending) return
    setSending(true)
    try {
      await onSendEmail(email.trim())
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={mode !== null} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t(`${mode ?? 'link'}.title`)}</DialogTitle>
          <DialogDescription>{t(`${mode ?? 'link'}.description`)}</DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <p className='text-muted-foreground flex items-center gap-2 py-6 text-sm'>
            <Loader2 className='size-4 animate-spin' />
            {t('preparing')}
          </p>
        ) : mode === 'qr' ? (
          <div className='flex flex-col items-center gap-4 py-2'>
            <div className='rounded-2xl border bg-white p-4'>
              <QRCodeSVG value={shareUrl} size={192} level='M' />
            </div>
            <p className='text-muted-foreground text-center text-xs break-all'>{shareUrl}</p>
          </div>
        ) : mode === 'email' ? (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void send()
            }}
            className='space-y-3'
          >
            <Input
              type='email'
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('email.placeholder')}
              autoComplete='email'
            />
            <Button type='submit' className='w-full' disabled={sending || !email.trim()}>
              {sending ? <Loader2 className='size-4 animate-spin' /> : <Send className='size-4' />}
              {t('email.submit')}
            </Button>
            {sent ? <p className='text-primary text-sm'>{t('email.sent', { email })}</p> : null}
          </form>
        ) : (
          <div className='flex items-center gap-2'>
            <Input readOnly value={shareUrl} className='font-mono text-xs' onFocus={(e) => e.currentTarget.select()} />
            <Button variant='outline' size='icon' onClick={() => void copy()} aria-label={t('link.copy')}>
              {copied ? <Check className='size-4' /> : <Copy className='size-4' />}
            </Button>
          </div>
        )}

        <p className='text-muted-foreground text-xs'>{t('privacyNote')}</p>
      </DialogContent>
    </Dialog>
  )
}
