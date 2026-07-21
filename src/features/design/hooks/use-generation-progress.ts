'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import type { GenerationProgress } from '../types/design.types'

/** Stage labels resolved from the `design.progress.<flow>.stages` message list. */
const STAGE_COUNT = 4

/** How often the ring advances. */
const TICK_MS = 250

/** The ring creeps to this ceiling and waits there for the real result. */
const CEILING = 95

interface UseGenerationProgressOptions {
  /** `estimate` for màn chờ Bước 2, `dossier` for màn chờ render Bước 3. */
  flow: 'estimate' | 'dossier'
  /** Flip to true when the underlying mutation resolves — snaps the ring to 100%. */
  complete: boolean
  /**
   * Roughly how long the work takes, so the ring paces itself across all four
   * stages instead of racing to the ceiling and sitting there.
   */
  expectedMs?: number
}

/**
 * Vòng tròn tiến độ % cho màn chờ Bước 2 và Bước 3 (mục III.3a, III.4b).
 *
 * Creeps roughly linearly toward 95% over `expectedMs` so the four status lines
 * each get screen time, then snaps to 100% once the real result lands. Purely
 * presentational — it never gates the actual data.
 */
export function useGenerationProgress({
  flow,
  complete,
  expectedMs = 9_000
}: UseGenerationProgressOptions): GenerationProgress {
  const t = useTranslations(`design.progress.${flow}`)
  const [creep, setCreep] = useState(0)

  useEffect(() => {
    if (complete) return
    const step = (CEILING * TICK_MS) / expectedMs
    const timer = setInterval(() => {
      setCreep((current) => Math.min(CEILING, current + step))
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [complete, expectedMs])

  // 100% is derived, not stored — writing it from the effect would cascade renders.
  const percent = complete ? 100 : creep
  const stageIndex = Math.min(STAGE_COUNT - 1, Math.floor((percent / 100) * STAGE_COUNT))

  return {
    percent,
    stage: t(`stages.${stageIndex}`),
    done: complete
  }
}
