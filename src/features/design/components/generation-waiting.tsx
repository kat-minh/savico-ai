'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { useGenerationProgress } from '../hooks/use-generation-progress'

interface GenerationWaitingProps {
  /** `estimate` = màn chờ Bước 2, `dossier` = màn chờ render Bước 3. */
  flow: 'estimate' | 'dossier'
  complete: boolean
  /** Roughly how long the generation takes, so the ring paces itself. */
  expectedMs?: number
  /**
   * Dòng "AI tự trò chuyện" dưới vòng tiến độ (mục III.3a) — do lớp app truyền
   * vào, vì nội dung thuộc `features/chatbot`.
   */
  chatStream?: ReactNode
}

/**
 * Phần TRÁI của màn hình chờ, dùng chung cho Bước 2 (mục III.3a) và Bước 3
 * (mục III.4b): vòng tròn tiến độ %, tiêu đề lớn, dòng mô tả trạng thái và
 * dòng AI tự trò chuyện. Panel cẩm nang ở cột phải do `DesignStepLayout` lo.
 */
export function GenerationWaiting({ flow, complete, expectedMs, chatStream }: GenerationWaitingProps) {
  const t = useTranslations(`design.progress.${flow}`)
  const progress = useGenerationProgress({ flow, complete, expectedMs })

  return (
    <div className='flex min-h-[26rem] flex-col items-center justify-center py-8 text-center'>
      <ProgressRing percent={progress.percent} />
      <h1 className='mt-8 text-2xl font-semibold tracking-tight text-balance sm:text-3xl'>{t('title')}</h1>
      <p className='text-muted-foreground mt-3 max-w-md text-pretty'>{progress.stage}</p>
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
      <span className='absolute inset-0 flex items-center justify-center text-3xl font-semibold tabular-nums'>
        {Math.round(percent)}%
      </span>
    </div>
  )
}
