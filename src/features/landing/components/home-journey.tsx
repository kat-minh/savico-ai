'use client'

import { ArrowRight, DraftingCompass, FilePen, FileText, House, Sparkles, Users, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/shared/components/ui/button'
import { HOME_JOURNEY_STEPS, type HomeJourneyStep } from '../constants/landing.constants'

const STEP_ICON: Record<HomeJourneyStep, LucideIcon> = {
  project: FilePen,
  design: DraftingCompass,
  dossier: FileText,
  contractor: Users,
  build: House
}

/**
 * Dải "Từ ý tưởng đến ngôi nhà hoàn thiện chỉ trong 5 bước".
 *
 * Năm thẻ đánh số nối bằng mũi tên, kết bằng nút tạo dự án. Mũi tên là Ô RIÊNG
 * của lưới (`li` dùng `contents` để nhả hai con ra thẳng lưới) chứ không vẽ đè
 * lên thẻ: có vậy thẻ mới co giãn theo nội dung mà mũi tên vẫn nằm đúng giữa
 * hai thẻ ở mọi bề ngang.
 */
export function HomeJourney({ onCreateProject }: { onCreateProject?: () => void }) {
  const t = useTranslations('landing.journey')

  return (
    <section className='mx-auto w-full max-w-[90rem] px-4 py-14 lg:px-8 lg:py-16'>
      <header className='flex flex-wrap items-end justify-between gap-x-10 gap-y-3'>
        <div className='space-y-2'>
          <p className='text-primary text-xs font-semibold tracking-[0.16em] uppercase'>{t('eyebrow')}</p>
          <h2 className='text-2xl font-bold tracking-tight text-balance lg:text-[1.75rem]'>{t('title')}</h2>
        </div>
        <p className='text-muted-foreground max-w-xs text-sm whitespace-pre-line lg:text-right'>{t('note')}</p>
      </header>

      <ol className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr)_auto)_minmax(0,1fr)] lg:gap-3'>
        {HOME_JOURNEY_STEPS.map((step, index) => {
          const Icon = STEP_ICON[step]
          return (
            <li key={step} className='contents'>
              <div className='bg-card relative flex h-full flex-col items-center gap-2 rounded-2xl border p-5 pt-7 text-center'>
                {/* Con số nằm ĐÈ LÊN viền trên, căn giữa thẻ (ảnh mockup). */}
                <span className='bg-primary-soft text-primary absolute -top-3 left-1/2 -translate-x-1/2 rounded-lg px-2.5 py-1 text-sm font-bold'>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Icon className='text-primary size-6' strokeWidth={1.75} />
                <h3 className='text-sm leading-snug font-bold text-balance'>{t(`items.${step}.title`)}</h3>
                <p className='text-muted-foreground text-xs leading-relaxed text-pretty'>
                  {t(`items.${step}.description`)}
                </p>
              </div>

              {index < HOME_JOURNEY_STEPS.length - 1 ? (
                <div aria-hidden className='hidden items-center justify-center self-center lg:flex'>
                  <ArrowRight className='text-primary/50 size-5' />
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>

      <div className='mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3'>
        <Button
          className='brand-green-button h-11 rounded-full px-8 text-base has-[>svg]:px-8'
          onClick={onCreateProject}
        >
          {t('cta')}
          <ArrowRight className='size-4' />
        </Button>
        <p className='text-muted-foreground flex items-center gap-2 text-sm'>
          <Sparkles className='text-primary size-4' />
          {t('ctaHint')}
        </p>
      </div>
    </section>
  )
}
