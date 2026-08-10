'use client'

import { useState } from 'react'
import { ArrowRight, CalendarClock, Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ZaloIcon } from '@/shared/components/common'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { siteConfig } from '@/shared/config'
import { cn } from '@/shared/lib/utils'

interface ConsultButtonProps {
  /** `solid` là nút chính ở trang chi tiết mẫu; `link` là liên kết ở trang bài viết. */
  variant?: 'solid' | 'link'
  className?: string
}

/**
 * Nút "Đặt lịch tư vấn 1:1" (Phần 2.3, 2.4, 3.3).
 *
 * Tài liệu Cẩm nang chỉ quy định CÓ nút này, không mô tả form đặt lịch. Nên nút
 * mở một hộp thoại gọn đưa thẳng tới hai kênh liên hệ đã chốt ở mục III.4c —
 * Gọi hotline và Chat Zalo — thay vì tự dựng luồng đặt lịch chưa ai duyệt.
 *
 * Khi khách chốt quy trình đặt lịch thật (trường nhập, nơi nhận yêu cầu, lịch
 * trống của kiến trúc sư), thay phần thân hộp thoại này là đủ.
 */
export function ConsultButton({ variant = 'solid', className }: ConsultButtonProps) {
  const t = useTranslations('handbook.consult')
  const [open, setOpen] = useState(false)

  const { hotline, zaloUrl } = siteConfig.contact

  return (
    <>
      {variant === 'solid' ? (
        <Button size='lg' className={cn('w-full justify-between', className)} onClick={() => setOpen(true)}>
          {t('cta')}
          <ArrowRight className='size-4' />
        </Button>
      ) : (
        <button
          type='button'
          onClick={() => setOpen(true)}
          className={cn('text-primary inline-flex items-center gap-2 text-sm font-medium hover:underline', className)}
        >
          <CalendarClock className='size-4' />
          {t('cta')}
          <ArrowRight className='size-4' />
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>{t('subtitle')}</DialogDescription>
          </DialogHeader>

          <div className='space-y-2'>
            <Button asChild size='lg' className='w-full'>
              <a href={`tel:${hotline.replace(/\s/g, '')}`}>
                <Phone className='size-4' />
                {t('call', { hotline })}
              </a>
            </Button>

            <Button asChild size='lg' variant='outline' className='w-full'>
              <a href={zaloUrl} target='_blank' rel='noopener noreferrer'>
                <ZaloIcon className='size-4' />
                {t('zalo')}
              </a>
            </Button>
          </div>

          <p className='text-muted-foreground text-xs'>{t('note')}</p>
        </DialogContent>
      </Dialog>
    </>
  )
}
