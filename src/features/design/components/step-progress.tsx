'use client'

import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/shared/lib/utils'
import { DESIGN_STEPS, STEP_HELP_TOPIC } from '../constants/design.constants'
import type { DesignStep } from '../types/design.types'
import { HelpLink } from './help-link'

/**
 * Thanh tiến trình (stepper) — cố định trên đầu mọi màn hình của luồng (mục III).
 * Nấc đang làm tô màu thương hiệu, nấc đã xong đánh dấu tích, kèm dòng trạng
 * thái nhỏ bên dưới tên nấc.
 */
export function StepProgress({ current }: { current: DesignStep }) {
  const t = useTranslations('design.steps')

  return (
    // Cùng một container với header, footer và nội dung bên dưới — nút "?" phải
    // thẳng hàng mép phải của nội dung, không dán vào mép màn hình.
    <nav aria-label={t('label')} className='bg-background/85 sticky top-16 z-30 backdrop-blur-xl'>
      <div className='mx-auto w-full max-w-6xl px-4 py-4 lg:px-8'>
        <div className='bg-card flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm sm:px-6'>
          <ol className='flex flex-1 items-center gap-2'>
            {DESIGN_STEPS.map((step, index) => {
              const done = step < current
              const active = step === current
              return (
                <li key={step} className='flex flex-1 items-center gap-3'>
                  <span
                    aria-current={active ? 'step' : undefined}
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                      done && 'bg-primary text-primary-foreground',
                      active && 'bg-primary text-primary-foreground',
                      !done && !active && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {done ? <Check className='size-4.5' /> : step}
                  </span>

                  <span className={cn('min-w-0', !active && 'hidden sm:block')}>
                    <span
                      className={cn(
                        'block truncate text-sm font-semibold',
                        active || done ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {t(`${step}`)}
                    </span>
                    <span className='text-muted-foreground block truncate text-xs'>
                      {t(done ? 'status.done' : active ? 'status.current' : 'status.pending')}
                    </span>
                  </span>

                  {/* Nối hai nấc bằng đường nét đứt; đoạn đã qua tô màu thương hiệu. */}
                  {index < DESIGN_STEPS.length - 1 ? (
                    <span
                      aria-hidden
                      className={cn(
                        'mx-1 hidden h-0 flex-1 border-t-2 border-dashed sm:block',
                        done ? 'border-primary' : 'border-border'
                      )}
                    />
                  ) : null}
                </li>
              )
            })}
          </ol>

          {/* Nút "?" mở đúng video hướng dẫn của bước đang làm. */}
          <HelpLink topic={STEP_HELP_TOPIC[current]} className='shrink-0' />
        </div>
      </div>
    </nav>
  )
}
