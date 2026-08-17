'use client'

import { ArrowRight, Bot, FileText, Smartphone, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cmsText, useCmsDocument } from '@/shared/cms'
import { HOME_STEPS, type HomeStep } from '../constants/landing.constants'

const STEP_ICON: Record<HomeStep, LucideIcon> = {
  input: Smartphone,
  estimate: Bot,
  dossier: FileText
}

/** Dải giới thiệu 3 bước dưới hero — ba thẻ nối bằng mũi tên đứt nét (mục II.2). */
export function HomeSteps() {
  const t = useTranslations('landing.steps')
  // Ba bước do admin sửa được (mục X); bỏ trống thì dùng bản dịch i18n.
  const home = useCmsDocument('home')

  return (
    <section className='bg-muted/30 border-y'>
      <div className='mx-auto w-full max-w-[90rem] px-4 py-14 lg:px-8'>
        <ol className='grid gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center md:gap-2'>
          {HOME_STEPS.map((step, index) => {
            const Icon = STEP_ICON[step]
            const copy = home.steps.find((item) => item.id === step)
            return (
              <li key={step} className='contents'>
                <div className='bg-card flex h-full items-start gap-4 rounded-2xl border p-6 shadow-sm'>
                  <span className='brand-gradient text-primary-foreground flex size-14 shrink-0 items-center justify-center rounded-full'>
                    <Icon className='size-7' />
                  </span>
                  <div className='space-y-1'>
                    <h3 className='flex items-center gap-2 font-semibold'>
                      <span className='border-primary/40 text-primary flex size-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold'>
                        {index + 1}
                      </span>
                      {cmsText(copy?.title, t(`${step}.title`))}
                    </h3>
                    <p className='text-muted-foreground text-sm leading-relaxed'>
                      {cmsText(copy?.description, t(`${step}.description`))}
                    </p>
                  </div>
                </div>
                {index < HOME_STEPS.length - 1 ? (
                  <div aria-hidden className='hidden items-center justify-center self-center md:flex'>
                    <span className='border-primary/40 w-6 border-t border-dashed' />
                    <ArrowRight className='text-primary/60 -ml-1.5 size-4' />
                  </div>
                ) : null}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
