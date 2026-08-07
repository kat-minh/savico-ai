'use client'

import { useTranslations } from 'next-intl'

import { StepInputForm, StepProgress } from '@/features/design'
import { useRouter } from '@/i18n/navigation'
import { designEstimateRoute } from '@/shared/constants/routes'

/** Bước 1 — tiêu đề + stepper + form nhập liệu; submit chuyển sang Bước 2. */
export function StepInputView({ projectId }: { projectId: string }) {
  const router = useRouter()
  const t = useTranslations('design.input')

  return (
    <>
      <StepProgress current={1} title={t('pageTitle')} />
      <StepInputForm projectId={projectId} onSubmit={() => router.push(designEstimateRoute(projectId))} />
    </>
  )
}
