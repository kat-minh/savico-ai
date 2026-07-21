import { ArrowRight, FileCheck2, Receipt, Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { HOME_STEPS } from '../constants/landing.constants'

const STEP_ICON = {
  input: Upload,
  estimate: Receipt,
  dossier: FileCheck2
} as const

/** Dải giới thiệu 3 bước dưới hero — ba thẻ nối bằng mũi tên (mục II.2). */
export function HomeSteps() {
  const t = useTranslations('landing.steps')

  return (
    <section className='bg-muted/30 border-y'>
      <div className='mx-auto w-full max-w-6xl px-4 py-16 lg:px-8'>
        <ol className='grid gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center md:gap-3'>
          {HOME_STEPS.map((step, index) => {
            const Icon = STEP_ICON[step]
            return (
              <li key={step} className='contents'>
                <div className='bg-card h-full space-y-3 rounded-2xl border p-6'>
                  <span className='bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl'>
                    <Icon className='size-5' />
                  </span>
                  <h3 className='font-semibold'>
                    {index + 1}. {t(`${step}.title`)}
                  </h3>
                  <p className='text-muted-foreground text-sm leading-relaxed'>{t(`${step}.description`)}</p>
                </div>
                {index < HOME_STEPS.length - 1 ? (
                  <ArrowRight aria-hidden className='text-muted-foreground mx-auto hidden size-6 md:block' />
                ) : null}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
