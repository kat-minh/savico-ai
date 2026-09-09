'use client'

import { ArrowRight, House } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/shared/components/ui/button'

/**
 * Dải chuyển đổi cuối trang chủ — "Sẵn sàng bắt đầu dự án của bạn?".
 *
 * Nền xanh RẤT nhạt chứ không phải dải xanh đặc như hai khối trên: đây là lời
 * mời cuối cùng, đứng ngay trên chân trang tối màu, nên phải nhẹ hơn để không
 * đấu màu với footer.
 */
export function HomeCta({ onCreateProject }: { onCreateProject?: () => void }) {
  const t = useTranslations('landing.cta')

  return (
    <section className='mx-auto w-full max-w-[90rem] px-4 pb-14 lg:px-8 lg:pb-16'>
      <div className='bg-primary/8 border-primary/15 flex flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl border px-6 py-5'>
        <span className='bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl'>
          <House className='size-6' strokeWidth={1.75} />
        </span>

        <div className='min-w-0 flex-1'>
          <p className='font-bold'>{t('title')}</p>
          <p className='text-muted-foreground text-sm text-pretty'>{t('subtitle')}</p>
        </div>

        <Button
          className='brand-green-button h-11 rounded-full px-8 text-base has-[>svg]:px-8'
          onClick={onCreateProject}
        >
          {t('action')}
          <ArrowRight className='size-4' />
        </Button>
      </div>
    </section>
  )
}
