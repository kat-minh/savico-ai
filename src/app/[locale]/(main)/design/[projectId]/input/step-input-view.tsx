'use client'

import { StepInputForm, StepProgress } from '@/features/design'
import { useRouter } from '@/i18n/navigation'
import { designEstimateRoute } from '@/shared/constants/routes'

/** Bước 1 — stepper + form nhập liệu; submit chuyển sang Bước 2. */
export function StepInputView({ projectId }: { projectId: string }) {
  const router = useRouter()

  return (
    <>
      <StepProgress current={1} />
      <StepInputForm projectId={projectId} onSubmit={() => router.push(designEstimateRoute(projectId))} />
    </>
  )
}
