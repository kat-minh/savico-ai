'use client'

import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { cn } from '@/shared/lib/utils'
import { useGenerationProgress } from '../hooks/use-generation-progress'
import { BlueprintIllustration } from './blueprint-illustration'
import { RenderProgressBars } from './render-progress-bars'

interface GenerationWaitingProps {
  /** `estimate` = màn chờ Bước 2, `dossier` = màn chờ render Bước 3. */
  flow: 'estimate' | 'dossier'
  complete: boolean
  /** Roughly how long the generation takes, so the ring paces itself. */
  expectedMs?: number
  /**
   * Tỉnh/TP của công trình — điền vào dòng checklist "Tính chi phí theo đơn giá
   * khu vực {tỉnh}" (mục IV.4).
   */
  province?: string
  /**
   * Dòng "AI tự trò chuyện" dưới vòng tiến độ (mục III.3a) — do lớp app truyền
   * vào, vì nội dung thuộc `features/chatbot`.
   */
  chatStream?: ReactNode
}

/** Ba mốc trạng thái của checklist màn chờ Bước 2 (Hình 07). */
const CHECKLIST_LENGTH = 3

/**
 * Cột tiến độ AI của màn hình chờ, dùng chung cho Bước 2 và Bước 3.
 *
 * Bước 2 (mục IV.4, Hình 07): vòng % + checklist 3 dòng + hình minh họa bản vẽ.
 * Bước 3 (mục IV.7, Hình 10): vòng % + 3 thanh tiến độ con + hộp mẹo vàng.
 *
 * Ở cả hai hình, cột này nằm bên PHẢI còn panel cẩm nang chiếm cột trái —
 * thứ tự do `DesignStepLayout` (prop `waiting`) quyết định.
 */
export function GenerationWaiting({ flow, complete, expectedMs, province, chatStream }: GenerationWaitingProps) {
  const t = useTranslations(`design.progress.${flow}`)
  const progress = useGenerationProgress({ flow, complete, expectedMs })

  // Mốc đang chạy suy từ %, để checklist và vòng tròn luôn kể cùng một câu chuyện.
  const activeIndex = Math.min(CHECKLIST_LENGTH - 1, Math.floor((progress.percent / 100) * CHECKLIST_LENGTH))

  return (
    <div className='flex flex-col items-center py-4 text-center'>
      <ProgressRing percent={progress.percent} />

      <h2 className='mt-6 text-xl font-semibold tracking-tight text-balance'>{t('title')}</h2>

      {flow === 'dossier' ? (
        <div className='mt-6 w-full'>
          <RenderProgressBars percent={progress.percent} />
        </div>
      ) : (
        <>
          <ol className='mt-6 w-full space-y-3 text-left'>
            {[0, 1, 2].map((index) => {
              const done = complete || index < activeIndex
              const active = !complete && index === activeIndex
              return (
                <li key={index} className='flex items-start gap-2.5'>
                  <span className='mt-0.5 flex size-4 shrink-0 items-center justify-center'>
                    {done ? (
                      <Check className='text-primary size-4' strokeWidth={3} />
                    ) : active ? (
                      <span className='bg-primary size-2.5 rounded-full' />
                    ) : (
                      <span className='border-muted-foreground/40 size-2.5 rounded-full border' />
                    )}
                  </span>
                  <span
                    className={cn(
                      'text-sm',
                      active && 'text-foreground font-medium',
                      !active && !done && 'text-muted-foreground'
                    )}
                  >
                    {/* Dòng cuối nêu đích danh tỉnh/TP để khách thấy đơn giá bám khu vực mình. */}
                    {index === 2
                      ? t('checklist.2', { province: province || t('unknownProvince') })
                      : t(`checklist.${index}`)}
                  </span>
                </li>
              )
            })}
          </ol>

          <BlueprintIllustration className='mt-7' />
        </>
      )}

      {chatStream}
    </div>
  )
}

/** Vòng tròn tiến độ % — số phần trăm nằm giữa vòng. */
function ProgressRing({ percent }: { percent: number }) {
  const radius = 68
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100)

  return (
    <div className='relative size-40'>
      <svg viewBox='0 0 160 160' className='size-full -rotate-90'>
        <circle cx='80' cy='80' r={radius} fill='none' strokeWidth='10' className='stroke-muted' />
        <circle
          cx='80'
          cy='80'
          r={radius}
          fill='none'
          strokeWidth='10'
          strokeLinecap='round'
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className='stroke-primary transition-[stroke-dashoffset] duration-500 ease-out'
        />
      </svg>
      {/* Căn giữa ở lớp ngoài, baseline chỉ dùng giữa số và dấu %: đặt
          `items-baseline` ngay trên lớp phủ `inset-0` sẽ kéo số lệch lên đỉnh vòng. */}
      <span className='absolute inset-0 flex items-center justify-center'>
        <span className='flex items-baseline gap-0.5'>
          <span className='text-primary-strong text-4xl font-bold tabular-nums'>{Math.round(percent)}</span>
          <span className='text-primary-strong text-lg font-semibold'>%</span>
        </span>
      </span>
    </div>
  )
}
