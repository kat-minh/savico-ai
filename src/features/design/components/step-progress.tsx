'use client'

import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/shared/lib/utils'
import { DESIGN_STEPS, STEP_HELP_TOPIC } from '../constants/design.constants'
import type { DesignStep } from '../types/design.types'
import { HelpLink } from './help-link'

/**
 * Thanh tiến trình (stepper) — cố định trên đầu mọi màn hình của luồng
 * (mục IV.0). Nấc đang làm tô màu thương hiệu, nấc đã xong đánh dấu tích, kèm
 * dòng trạng thái nhỏ bên dưới tên nấc. `title` (tuỳ chọn) là tiêu đề màn hình
 * hiện phía trên thanh, theo Hình 04.
 */
interface StepProgressProps {
  current: DesignStep
  /** Tiêu đề màn hình hiện phía trên thanh (Hình 04, 07, 08). */
  title?: string
  /**
   * Nấc đang đứng đã xong việc — nấc đó chuyển sang tích xanh kèm dòng "Vừa
   * hoàn thành" (mục IV.5: màn kết quả dự toán, Hình 08).
   */
  currentDone?: boolean
}

export function StepProgress({ current, title, currentDone = false }: StepProgressProps) {
  const t = useTranslations('design.steps')

  return (
    <>
      {/* Tiêu đề màn hình nằm TRÊN stepper và cuộn theo trang (Hình 04) — đặt
          trong `nav` sticky thì nó sẽ dính luôn, chiếm mất chiều cao. */}
      {title ? (
        <div className='mx-auto w-full max-w-6xl px-4 pt-6 lg:px-8'>
          <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
        </div>
      ) : null}

      {/* Cùng một container với header, footer và nội dung bên dưới — nút "?" phải
          thẳng hàng mép phải của nội dung, không dán vào mép màn hình. */}
      <nav aria-label={t('label')} className='bg-background/85 sticky top-16 z-30 backdrop-blur-xl'>
        <div className='mx-auto w-full max-w-6xl px-4 py-4 lg:px-8'>
          {/*
           * Bố cục theo thanh tiến trình trong bản mô tả (Hình S03/S04): vòng
           * tròn nằm TRÊN, nhãn nằm DƯỚI và canh giữa theo vòng tròn, đường nối
           * chạy ngang qua tâm hai vòng liền nhau, ba nấc chia ĐỀU cả chiều
           * rộng. Bản cũ đặt nhãn nằm cạnh vòng tròn nên các nấc so le nhau, cả
           * thanh dồn về trái và chừa một mảng trống bên phải.
           */}
          <div className='bg-card relative rounded-2xl border px-4 py-4 shadow-sm sm:px-6'>
            <ol className='flex items-start'>
              {DESIGN_STEPS.map((step, index) => {
                const done = step < current || (step === current && currentDone)
                const active = step === current && !currentDone
                return (
                  <li key={step} className='relative flex min-w-0 flex-1 flex-col items-center gap-1.5'>
                    {/* Đường nối vẽ bằng nấc SAU, kéo từ tâm nấc trước sang tâm
                        nấc này — cách duy nhất giữ nó luôn đúng giữa hai vòng
                        tròn khi các cột co giãn theo nhau. */}
                    {index > 0 ? (
                      <span
                        aria-hidden
                        className={cn(
                          'absolute top-[1.125rem] -left-1/2 h-0.5 w-full rounded-full',
                          done || active ? 'bg-primary' : 'bg-border'
                        )}
                      />
                    ) : null}

                    <span
                      aria-current={active ? 'step' : undefined}
                      className={cn(
                        'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                        done && 'bg-primary text-primary-foreground',
                        active && 'bg-primary text-primary-foreground',
                        !done && !active && 'bg-muted text-muted-foreground border'
                      )}
                    >
                      {done ? <Check className='size-4.5' /> : step}
                    </span>

                    <span className='min-w-0 px-2 text-center'>
                      <span
                        className={cn(
                          'block truncate text-sm font-semibold',
                          active ? 'text-primary-strong' : done ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {t(`${step}`)}
                      </span>
                      <span className='text-muted-foreground block truncate text-xs'>
                        {step === current && currentDone
                          ? t('status.justDone')
                          : t(done ? 'status.done' : active ? 'status.current' : 'status.pending')}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ol>

            {/* Nút "?" mở đúng video hướng dẫn của bước đang làm. Đặt tuyệt đối
                ở góc phải để không chiếm một cột trong lưới chia đều. */}
            <HelpLink topic={STEP_HELP_TOPIC[current]} className='absolute top-3 right-3 shrink-0' />
          </div>
        </div>
      </nav>
    </>
  )
}
